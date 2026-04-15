import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class FreightScheduling(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Rascunho"
        CONFIRMED = "CONFIRMED", "Confirmado"
        ASSIGNED = "ASSIGNED", "Designado"
        IN_TRANSIT = "IN_TRANSIT", "Em Trânsito"
        DELIVERED = "DELIVERED", "Entregue"
        CANCELLED = "CANCELLED", "Cancelado"

    class Modality(models.TextChoices):
        FTL = "FTL", "Caminhão Exclusivo"
        LTL = "LTL", "Carga Fracionada"
        MOTO = "MOTO", "Moto"
        VAN = "VAN", "Van"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name="freights", null=True, blank=True
    )

    # Dados do solicitante
    requester_name = models.CharField(max_length=150)
    requester_cpf = models.CharField(max_length=11)
    requester_phone = models.CharField(max_length=20)
    requester_email = models.EmailField()

    # Endereço de coleta
    pickup_street = models.CharField(max_length=255)
    pickup_number = models.CharField(max_length=20)
    pickup_complement = models.CharField(max_length=100, blank=True)
    pickup_neighborhood = models.CharField(max_length=100)
    pickup_city = models.CharField(max_length=100)
    pickup_state = models.CharField(max_length=2)
    pickup_zip_code = models.CharField(max_length=8)

    # Endereço de entrega
    delivery_street = models.CharField(max_length=255)
    delivery_number = models.CharField(max_length=20)
    delivery_complement = models.CharField(max_length=100, blank=True)
    delivery_neighborhood = models.CharField(max_length=100)
    delivery_city = models.CharField(max_length=100)
    delivery_state = models.CharField(max_length=2)
    delivery_zip_code = models.CharField(max_length=8)

    # Agendamento
    scheduled_date = models.DateField()
    modality = models.CharField(max_length=10, choices=Modality.choices, default=Modality.LTL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    # Dados da carga
    total_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    declared_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Agendamento de Frete"
        verbose_name_plural = "Agendamentos de Frete"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Frete {str(self.id)[:8]} — {self.requester_name} [{self.status}]"


class FreightItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    freight = models.ForeignKey(FreightScheduling, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=2)
    length_cm = models.DecimalField(max_digits=8, decimal_places=2)
    width_cm = models.DecimalField(max_digits=8, decimal_places=2)
    height_cm = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = "Item do Frete"
        verbose_name_plural = "Itens do Frete"

    def __str__(self) -> str:
        return f"{self.description} (x{self.quantity})"


class FreightStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    freight = models.ForeignKey(FreightScheduling, on_delete=models.CASCADE, related_name="history")
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    note = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Histórico de Status"
        verbose_name_plural = "Histórico de Status"
        ordering = ["-changed_at"]
