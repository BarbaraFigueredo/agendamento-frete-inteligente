"""
Value Object: Money
────────────────────
Representa um valor monetário com precisão decimal.
Evita problemas de float; usa Decimal internamente.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


@dataclass(frozen=True)
class Money:
    """Value Object para valores monetários."""

    amount: Decimal
    currency: str = "BRL"

    def __post_init__(self) -> None:
        if not isinstance(self.amount, Decimal):
            object.__setattr__(self, "amount", Decimal(str(self.amount)))
        if self.amount < Decimal("0"):
            raise ValueError(f"Valor monetário não pode ser negativo: {self.amount}.")
        # Normaliza para 2 casas decimais
        object.__setattr__(
            self, "amount", self.amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        )

    # ── Fábricas ──────────────────────────────────────────────────────────────

    @classmethod
    def of(cls, amount: float | int | str | Decimal, currency: str = "BRL") -> "Money":
        try:
            return cls(amount=Decimal(str(amount)), currency=currency)
        except InvalidOperation as exc:
            raise ValueError(f"Valor inválido para Money: '{amount}'.") from exc

    @classmethod
    def zero(cls, currency: str = "BRL") -> "Money":
        return cls(amount=Decimal("0.00"), currency=currency)

    # ── Operações aritméticas ─────────────────────────────────────────────────

    def __add__(self, other: "Money") -> "Money":
        self._assert_same_currency(other)
        return Money(amount=self.amount + other.amount, currency=self.currency)

    def __sub__(self, other: "Money") -> "Money":
        self._assert_same_currency(other)
        result = self.amount - other.amount
        if result < Decimal("0"):
            raise ValueError("Subtração resultaria em valor negativo.")
        return Money(amount=result, currency=self.currency)

    def __mul__(self, factor: int | float | Decimal) -> "Money":
        return Money(amount=self.amount * Decimal(str(factor)), currency=self.currency)

    def __lt__(self, other: "Money") -> bool:
        self._assert_same_currency(other)
        return self.amount < other.amount

    def __le__(self, other: "Money") -> bool:
        self._assert_same_currency(other)
        return self.amount <= other.amount

    # ── Representação ─────────────────────────────────────────────────────────

    def __str__(self) -> str:
        return f"{self.currency} {self.amount:.2f}"

    # ── Auxiliares ────────────────────────────────────────────────────────────

    def _assert_same_currency(self, other: "Money") -> None:
        if self.currency != other.currency:
            raise ValueError(
                f"Operação entre moedas diferentes: {self.currency} × {other.currency}."
            )
