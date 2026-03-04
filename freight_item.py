"""
Value Object: FreightItem
──────────────────────────
Representa um item individual dentro do agendamento de frete.
Imutável. Valida dimensões, peso e quantidade.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal

from .money import Money


@dataclass(frozen=True)
class FreightItem:
    """
    Descreve um item a ser transportado.

    Atributos
    ----------
    description : str
        Descrição do item (ex.: "Geladeira", "Sofá 3 lugares").
    quantity : int
        Quantidade de unidades deste item.
    weight_kg : Decimal
        Peso unitário em quilogramas.
    length_cm : Decimal
        Comprimento em centímetros.
    width_cm : Decimal
        Largura em centímetros.
    height_cm : Decimal
        Altura em centímetros.
    declared_value : Money
        Valor declarado do item (para fins de seguro/indenização).
    fragile : bool
        Indica se o item exige manuseio especial.
    notes : str
        Observações adicionais (ex.: "Não empilhar").
    """

    description: str
    quantity: int
    weight_kg: Decimal
    length_cm: Decimal
    width_cm: Decimal
    height_cm: Decimal
    declared_value: Money
    fragile: bool = False
    notes: str = ""

    def __post_init__(self) -> None:
        self._coerce_decimals()
        self._validate()

    # ── Conversão de tipos ────────────────────────────────────────────────────

    def _coerce_decimals(self) -> None:
        for attr in ("weight_kg", "length_cm", "width_cm", "height_cm"):
            val = getattr(self, attr)
            if not isinstance(val, Decimal):
                object.__setattr__(self, attr, Decimal(str(val)))

    # ── Validação ─────────────────────────────────────────────────────────────

    def _validate(self) -> None:
        if not self.description.strip():
            raise ValueError("Descrição do item não pode ser vazia.")

        if self.quantity < 1:
            raise ValueError(f"Quantidade deve ser ≥ 1, recebido: {self.quantity}.")

        for attr, label in (
            ("weight_kg", "Peso"),
            ("length_cm", "Comprimento"),
            ("width_cm", "Largura"),
            ("height_cm", "Altura"),
        ):
            val: Decimal = getattr(self, attr)
            if val <= Decimal("0"):
                raise ValueError(f"{label} deve ser > 0, recebido: {val}.")

    # ── Propriedades calculadas ───────────────────────────────────────────────

    @property
    def volume_m3(self) -> Decimal:
        """Volume unitário em metros cúbicos."""
        return (self.length_cm * self.width_cm * self.height_cm) / Decimal("1_000_000")

    @property
    def total_weight_kg(self) -> Decimal:
        """Peso total considerando a quantidade."""
        return self.weight_kg * self.quantity

    @property
    def total_volume_m3(self) -> Decimal:
        """Volume total considerando a quantidade."""
        return self.volume_m3 * self.quantity

    @property
    def total_declared_value(self) -> Money:
        """Valor total declarado (unitário × quantidade)."""
        return self.declared_value * self.quantity

    def __str__(self) -> str:
        return (
            f"{self.quantity}× {self.description} "
            f"({self.total_weight_kg:.2f} kg | {self.total_volume_m3:.4f} m³)"
        )
