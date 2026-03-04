"""
Value Object: CPF
─────────────────
Representa um CPF brasileiro válido.
Imutável, auto-validado na construção. Nenhuma dependência de framework.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class CPF:
    """Value Object para CPF brasileiro."""

    value: str

    def __post_init__(self) -> None:
        cleaned = self._clean(self.value)
        # Contorna a imutabilidade do frozen dataclass para armazenar o valor limpo
        object.__setattr__(self, "value", cleaned)
        self._validate(cleaned)

    # ── Fábrica ──────────────────────────────────────────────────────────────

    @classmethod
    def from_string(cls, raw: str) -> "CPF":
        return cls(value=raw)

    # ── Representação ────────────────────────────────────────────────────────

    def formatted(self) -> str:
        """Retorna CPF formatado: 000.000.000-00."""
        v = self.value
        return f"{v[:3]}.{v[3:6]}.{v[6:9]}-{v[9:]}"

    def __str__(self) -> str:
        return self.formatted()

    # ── Validação interna ────────────────────────────────────────────────────

    @staticmethod
    def _clean(value: str) -> str:
        return re.sub(r"\D", "", value)

    @staticmethod
    def _validate(cpf: str) -> None:
        if len(cpf) != 11:
            raise ValueError(f"CPF deve ter 11 dígitos numéricos, recebido: {len(cpf)}.")

        # Sequências inválidas (todos os dígitos iguais)
        if cpf == cpf[0] * 11:
            raise ValueError("CPF inválido: todos os dígitos são iguais.")

        # Primeiro dígito verificador
        total = sum(int(cpf[i]) * (10 - i) for i in range(9))
        remainder = (total * 10) % 11
        if remainder == 10:
            remainder = 0
        if remainder != int(cpf[9]):
            raise ValueError("CPF inválido: primeiro dígito verificador incorreto.")

        # Segundo dígito verificador
        total = sum(int(cpf[i]) * (11 - i) for i in range(10))
        remainder = (total * 10) % 11
        if remainder == 10:
            remainder = 0
        if remainder != int(cpf[10]):
            raise ValueError("CPF inválido: segundo dígito verificador incorreto.")
