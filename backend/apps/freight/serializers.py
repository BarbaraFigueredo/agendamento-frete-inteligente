from rest_framework import serializers

from .models import FreightItem, FreightScheduling, FreightStatusHistory


class FreightItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreightItem
        fields = ["id", "description", "quantity", "weight_kg", "length_cm", "width_cm", "height_cm"]
        read_only_fields = ["id"]


class FreightStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FreightStatusHistory
        fields = ["id", "from_status", "to_status", "note", "changed_at"]
        read_only_fields = ["id", "changed_at"]


class FreightSchedulingSerializer(serializers.ModelSerializer):
    items = FreightItemSerializer(many=True)
    history = FreightStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = FreightScheduling
        fields = [
            "id",
            "requester_name", "requester_cpf", "requester_phone", "requester_email",
            "pickup_street", "pickup_number", "pickup_complement",
            "pickup_neighborhood", "pickup_city", "pickup_state", "pickup_zip_code",
            "delivery_street", "delivery_number", "delivery_complement",
            "delivery_neighborhood", "delivery_city", "delivery_state", "delivery_zip_code",
            "scheduled_date", "modality", "status",
            "total_weight_kg", "declared_value", "notes",
            "items", "history",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at", "history"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        freight = FreightScheduling.objects.create(**validated_data)
        for item_data in items_data:
            FreightItem.objects.create(freight=freight, **item_data)
        FreightStatusHistory.objects.create(
            freight=freight,
            to_status=freight.status,
            note="Agendamento criado.",
        )
        return freight

    def update(self, instance, validated_data):
        validated_data.pop("items", None)
        return super().update(instance, validated_data)


class FreightStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=FreightScheduling.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="")

    _ALLOWED_TRANSITIONS: dict[str, set[str]] = {
        "DRAFT":      {"CONFIRMED", "CANCELLED"},
        "CONFIRMED":  {"ASSIGNED",  "CANCELLED"},
        "ASSIGNED":   {"IN_TRANSIT", "CANCELLED"},
        "IN_TRANSIT": {"DELIVERED"},
        "DELIVERED":  set(),
        "CANCELLED":  set(),
    }

    def validate(self, attrs):
        current = self.context["current_status"]
        new = attrs["status"]
        allowed = self._ALLOWED_TRANSITIONS.get(current, set())
        if new not in allowed:
            raise serializers.ValidationError(
                {"status": f"Transição de '{current}' para '{new}' não é permitida."}
            )
        return attrs
