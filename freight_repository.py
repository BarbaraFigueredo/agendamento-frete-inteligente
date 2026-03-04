"""
Interface: IFreightRepository
──────────────────────────────
Define o contrato que qualquer implementação de repositório deve satisfazer.
A camada de domínio/aplicação depende DESTA abstração, nunca da implementação
concreta (que vive na camada de infrastructure).

Seguindo o Princípio da Inversão de Dependência (DIP).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional

from ..domain.entities.freight_scheduling import FreightScheduling, FreightStatus
from ..domain.value_objects.cpf import CPF


class IFreightRepository(ABC):
    """Porta de saída para persistência de FreightScheduling."""

    @abstractmethod
    def save(self, freight: FreightScheduling) -> FreightScheduling:
        """Persiste um novo agendamento ou atualiza um existente."""
        ...

    @abstractmethod
    def find_by_id(self, freight_id: str) -> Optional[FreightScheduling]:
        """Busca um agendamento pelo ID único. Retorna None se não encontrado."""
        ...

    @abstractmethod
    def find_by_cpf(self, cpf: CPF) -> List[FreightScheduling]:
        """Lista todos os agendamentos de um solicitante pelo CPF."""
        ...

    @abstractmethod
    def find_by_status(self, status: FreightStatus) -> List[FreightScheduling]:
        """Lista todos os agendamentos em um determinado status."""
        ...

    @abstractmethod
    def list_all(self, *, page: int = 1, page_size: int = 20) -> List[FreightScheduling]:
        """Lista agendamentos com paginação."""
        ...

    @abstractmethod
    def delete(self, freight_id: str) -> None:
        """Remove um agendamento (uso administrativo — prefira cancelamento)."""
        ...
