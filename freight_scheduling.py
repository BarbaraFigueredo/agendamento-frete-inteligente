"""
Entidade de Domínio: FreightScheduling  (Agendamento de Frete)
───────────────────────────────────────────────────────────────
Regras:
  • Contém toda a lógica de negócio ligada ao agendamento de um frete.
  • Totalmente independente de framework (sem Django, sem SQLAlchemy).
  • Usa Value Objects para campos com invariantes próprias.
  • Expõe métodos de comportamento que respeitam as regras do domínio.
  • O estado é mutável só através dos métodos públicos (Never set attributes directly).
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from enum import Enum
from typing import List, Optional

from ..value_objects.address import Address
from ..value_objects.cpf import CPF
from ..value_objects.freight_item import FreightItem
from ..value_objects.money import Money
from ..exceptions.freight_exceptions import (
    FreightAlreadyCancelledException,
    FreightNoItemsException,
    FreightScheduledDateException,
    FreightStatusTransitionException,
)


# ─────────────────────────────────────────────────────────────────────────────
# Enums de domínio
# ─────────────────────────────────────────────────────────────────────────────

class FreightStatus(str, Enum):
    """Ciclo de vida de um agendamento de frete."""
    DRAFT        = "DRAFT"         # Rascunho (criado, sem confirmação)
    CONFIRMED    = "CONFIRMED"     # Confirmado pelo solicitante
    ASSIGNED     = "ASSIGNED"      # Motorista/transportadora designada
    IN_TRANSIT   = "IN_TRANSIT"    # Carga em trânsito
    DELIVERED    = "DELIVERED"     # Entrega concluída
    CANCELLED    = "CANCELLED"     # Cancelado


class FreightModality(str, Enum):
    """Modalidade de transporte."""
    FULL_TRUCK_LOAD  = "FTL"   # Caminhão exclusivo
    LESS_TRUCK_LOAD  = "LTL"   # Carga fracionada
    MOTORCYCLE       = "MOTO"  # Moto (pequenos volumes)
    VAN              = "VAN"   # Van


# Transições de status permitidas
_ALLOWED_TRANSITIONS: dict[FreightStatus, set[FreightStatus]] = {
    FreightStatus.DRAFT:      {FreightStatus.CONFIRMED, FreightStatus.CANCELLED},
    FreightStatus.CONFIRMED:  {FreightStatus.ASSIGNED,  FreightStatus.CANCELLED},
    FreightStatus.ASSIGNED:   {FreightStatus.IN_TRANSIT, FreightStatus.CANCELLED},
    FreightStatus.IN_TRANSIT: {FreightStatus.DELIVERED},
    FreightStatus.DELIVERED:  set(),
    FreightStatus.CANCELLED:  set(),
}


# ─────────────────────────────────────────────────────────────────────────────
# Entidade
# ─────────────────────────────────────────────────────────────────────────────

class FreightScheduling:
    """
    Agendamento de Frete — Entidade raiz do Agregado.

    Parâmetros obrigatórios
    -----------------------
    requester_cpf      : CPF do solicitante.
    requester_name     : Nome completo do solicitante.
    requester_phone    : Telefone de contato (com DDD).
    requester_email    : E-mail de contato.

    pickup_address     : Endereço de coleta.
    delivery_address   : Endereço de entrega.

    scheduled_date     : Data prevista para coleta (futura).
    modality           : Modalidade de transporte desejada.

    items              : Lista de itens a transportar (≥ 1).

    Parâmetros opcionais
    --------------------
    freight_id         : UUID do agendamento (gerado automaticamente se omitido).
    estimated_value    : Valor estimado do frete (calculado externamente).
    notes              : Observações gerais.
    status             : Status inicial (padrão: DRAFT).
    created_at         : Timestamp de criação (UTC).
    updated_at         : Timestamp da última atualização (UTC).
    """

    def __init__(
        self,
        *,
        # ── Solicitante ──────────────────────────────────────────────────────
        requester_cpf: CPF,
        requester_name: str,
        requester_phone: str,
        requester_email: str,
        # ── Endereços ────────────────────────────────────────────────────────
        pickup_address: Address,
        delivery_address: Address,
        # ── Agendamento ──────────────────────────────────────────────────────
        scheduled_date: date,
        modality: FreightModality,
        # ── Itens ────────────────────────────────────────────────────────────
        items: List[FreightItem],
        # ── Opcionais ────────────────────────────────────────────────────────
        freight_id: Optional[str] = None,
        estimated_value: Optional[Money] = None,
        notes: str = "",
        status: FreightStatus = FreightStatus.DRAFT,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ) -> None:
        # Identidade
        self.freight_id: str = freight_id or str(uuid.uuid4())

        # Solicitante
        self.requester_cpf: CPF = requester_cpf
        self.requester_name: str = requester_name
        self.requester_phone: str = requester_phone
        self.requester_email: str = requester_email

        # Endereços
        self.pickup_address: Address = pickup_address
        self.delivery_address: Address = delivery_address

        # Agendamento
        self.scheduled_date: date = scheduled_date
        self.modality: FreightModality = modality

        # Itens
        self._items: List[FreightItem] = list(items)

        # Financeiro
        self.estimated_value: Optional[Money] = estimated_value

        # Metadados
        self.notes: str = notes
        self._status: FreightStatus = status
        self.created_at: datetime = created_at or datetime.now(timezone.utc)
        self.updated_at: datetime = updated_at or self.created_at

        # Validações iniciais
        self._validate_on_create()

    # ─────────────────────────────────────────────────────────────────────────
    # Propriedades de leitura
    # ─────────────────────────────────────────────────────────────────────────

    @property
    def status(self) -> FreightStatus:
        return self._status

    @property
    def items(self) -> List[FreightItem]:
        return list(self._items)  # cópia defensiva

    # ── Totais calculados ─────────────────────────────────────────────────────

    @property
    def total_weight_kg(self):
        from decimal import Decimal
        return sum((item.total_weight_kg for item in self._items), Decimal("0"))

    @property
    def total_volume_m3(self):
        from decimal import Decimal
        return sum((item.total_volume_m3 for item in self._items), Decimal("0"))

    @property
    def total_declared_value(self) -> Money:
        total = Money.zero()
        for item in self._items:
            total = total + item.total_declared_value
        return total

    @property
    def item_count(self) -> int:
        return sum(item.quantity for item in self._items)

    @property
    def has_fragile_items(self) -> bool:
        return any(item.fragile for item in self._items)

    # ─────────────────────────────────────────────────────────────────────────
    # Comportamentos / Casos de uso do domínio
    # ─────────────────────────────────────────────────────────────────────────

    def confirm(self) -> None:
        """Confirma o agendamento (DRAFT → CONFIRMED)."""
        self._transition_to(FreightStatus.CONFIRMED)

    def assign(self) -> None:
        """Designa motorista/transportadora (CONFIRMED → ASSIGNED)."""
        self._transition_to(FreightStatus.ASSIGNED)

    def start_transit(self) -> None:
        """Marca o frete como em trânsito (ASSIGNED → IN_TRANSIT)."""
        self._transition_to(FreightStatus.IN_TRANSIT)

    def deliver(self) -> None:
        """Registra entrega concluída (IN_TRANSIT → DELIVERED)."""
        self._transition_to(FreightStatus.DELIVERED)

    def cancel(self) -> None:
        """Cancela o agendamento."""
        if self._status == FreightStatus.CANCELLED:
            raise FreightAlreadyCancelledException(self.freight_id)
        self._transition_to(FreightStatus.CANCELLED)

    def update_estimated_value(self, value: Money) -> None:
        """Atualiza o valor estimado do frete."""
        self.estimated_value = value
        self._touch()

    def add_item(self, item: FreightItem) -> None:
        """Adiciona um item à lista (apenas em DRAFT)."""
        if self._status != FreightStatus.DRAFT:
            raise FreightStatusTransitionException(
                self._status.value, "ADD_ITEM"
            )
        self._items.append(item)
        self._touch()

    def update_notes(self, notes: str) -> None:
        """Atualiza observações gerais."""
        self.notes = notes
        self._touch()

    # ─────────────────────────────────────────────────────────────────────────
    # Validações de invariantes
    # ─────────────────────────────────────────────────────────────────────────

    def _validate_on_create(self) -> None:
        if not self._items:
            raise FreightNoItemsException()

        if not self.requester_name.strip():
            raise ValueError("Nome do solicitante não pode ser vazio.")

        if not self.requester_phone.strip():
            raise ValueError("Telefone do solicitante não pode ser vazio.")

        if not self.requester_email.strip() or "@" not in self.requester_email:
            raise ValueError(f"E-mail inválido: '{self.requester_email}'.")

        if self.scheduled_date < date.today():
            raise FreightScheduledDateException(
                f"Data de coleta deve ser futura. Recebido: {self.scheduled_date}."
            )

        if self.pickup_address == self.delivery_address:
            raise ValueError(
                "Endereço de coleta e entrega não podem ser o mesmo."
            )

    # ─────────────────────────────────────────────────────────────────────────
    # Internos
    # ─────────────────────────────────────────────────────────────────────────

    def _transition_to(self, new_status: FreightStatus) -> None:
        allowed = _ALLOWED_TRANSITIONS.get(self._status, set())
        if new_status not in allowed:
            raise FreightStatusTransitionException(
                self._status.value, new_status.value
            )
        self._status = new_status
        self._touch()

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)

    # ─────────────────────────────────────────────────────────────────────────
    # Representação
    # ─────────────────────────────────────────────────────────────────────────

    def __repr__(self) -> str:
        return (
            f"<FreightScheduling id={self.freight_id!r} "
            f"status={self._status.value!r} "
            f"cpf={self.requester_cpf!r} "
            f"date={self.scheduled_date!r}>"
        )

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, FreightScheduling):
            return NotImplemented
        return self.freight_id == other.freight_id

    def __hash__(self) -> int:
        return hash(self.freight_id)
