"""
Value Object: Address
──────────────────────
Representa um endereço completo para origem/destino do frete.
Imutável e auto-validado.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Address:
    """Value Object para endereço completo."""

    street: str        # logradouro
    number: str        # número (pode ser "S/N")
    complement: str    # apto, bloco, etc.  (pode ser vazio)
    neighborhood: str  # bairro
    city: str          # cidade
    state: str         # UF  (2 letras)
    zip_code: str      # CEP sem formatação (8 dígitos)
    country: str = "BR"

    # Siglas de UF válidas
    _VALID_STATES = frozenset({
        "AC","AL","AP","AM","BA","CE","DF","ES","GO",
        "MA","MT","MS","MG","PA","PB","PR","PE","PI",
        "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
    })

    def __post_init__(self) -> None:
        self._validate()

    # ── Validação ────────────────────────────────────────────────────────────

    def _validate(self) -> None:
        if not self.street.strip():
            raise ValueError("Logradouro não pode ser vazio.")

        if not self.city.strip():
            raise ValueError("Cidade não pode ser vazia.")

        state_upper = self.state.upper()
        object.__setattr__(self, "state", state_upper)
        if state_upper not in self._VALID_STATES:
            raise ValueError(f"UF inválida: '{self.state}'. Use a sigla de 2 letras.")

        cleaned_zip = re.sub(r"\D", "", self.zip_code)
        if len(cleaned_zip) != 8:
            raise ValueError(f"CEP deve ter 8 dígitos, recebido: '{self.zip_code}'.")
        object.__setattr__(self, "zip_code", cleaned_zip)

    # ── Representação ────────────────────────────────────────────────────────

    def formatted_zip(self) -> str:
        return f"{self.zip_code[:5]}-{self.zip_code[5:]}"

    def full_address(self) -> str:
        parts = [f"{self.street}, {self.number}"]
        if self.complement:
            parts.append(self.complement)
        parts.append(self.neighborhood)
        parts.append(f"{self.city}/{self.state}")
        parts.append(f"CEP {self.formatted_zip()}")
        return " – ".join(parts)

    def __str__(self) -> str:
        return self.full_address()
