"""
Exceções de Domínio – Freight
──────────────────────────────
Toda exceção levantada pela camada de domínio herda de DomainException,
o que permite que as camadas externas (application, presentation) tratem
erros de negócio de forma uniforme, sem precisar conhecer detalhes internos.
"""
from __future__ import annotations


class DomainException(Exception):
    """Base para todas as exceções de domínio."""

    def __init__(self, message: str, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.code = code or self.__class__.__name__

    def __str__(self) -> str:
        return f"[{self.code}] {self.message}"


# ── Frete ─────────────────────────────────────────────────────────────────────

class FreightNotFoundException(DomainException):
    """Lançada quando um agendamento de frete não é encontrado pelo ID."""

    def __init__(self, freight_id: str) -> None:
        super().__init__(
            message=f"Agendamento de frete '{freight_id}' não encontrado.",
            code="FREIGHT_NOT_FOUND",
        )


class FreightAlreadyCancelledException(DomainException):
    """Lançada ao tentar cancelar um frete já cancelado."""

    def __init__(self, freight_id: str) -> None:
        super().__init__(
            message=f"O frete '{freight_id}' já está cancelado.",
            code="FREIGHT_ALREADY_CANCELLED",
        )


class FreightStatusTransitionException(DomainException):
    """Lançada quando uma transição de status inválida é tentada."""

    def __init__(self, from_status: str, to_status: str) -> None:
        super().__init__(
            message=f"Transição de status inválida: '{from_status}' → '{to_status}'.",
            code="INVALID_STATUS_TRANSITION",
        )


class FreightNoItemsException(DomainException):
    """Lançada ao criar um frete sem itens."""

    def __init__(self) -> None:
        super().__init__(
            message="Um agendamento de frete deve conter pelo menos um item.",
            code="FREIGHT_NO_ITEMS",
        )


class FreightScheduledDateException(DomainException):
    """Lançada quando a data de coleta é inválida (passado ou muito distante)."""

    def __init__(self, reason: str) -> None:
        super().__init__(message=reason, code="FREIGHT_INVALID_DATE")


# ── Valor / Pagamento ─────────────────────────────────────────────────────────

class InvalidFreightValueException(DomainException):
    """Lançada quando o valor calculado do frete é inválido."""

    def __init__(self, reason: str) -> None:
        super().__init__(message=reason, code="INVALID_FREIGHT_VALUE")
