from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import FreightScheduling, FreightStatusHistory
from .serializers import (
    FreightSchedulingSerializer,
    FreightStatusUpdateSerializer,
)


class FreightListCreateView(generics.ListCreateAPIView):
    serializer_class = FreightSchedulingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = FreightScheduling.objects.prefetch_related("items", "history").all()
        st = self.request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)
        cpf = self.request.query_params.get("cpf")
        if cpf:
            qs = qs.filter(requester_cpf=cpf)
        return qs

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(requester=user)


class FreightDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FreightScheduling.objects.prefetch_related("items", "history").all()
    serializer_class = FreightSchedulingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "id"


class FreightStatusUpdateView(generics.GenericAPIView):
    queryset = FreightScheduling.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FreightStatusUpdateSerializer
    lookup_field = "id"

    def patch(self, request, id):
        freight = self.get_object()
        serializer = FreightStatusUpdateSerializer(
            data=request.data,
            context={"current_status": freight.status},
        )
        serializer.is_valid(raise_exception=True)

        old_status = freight.status
        freight.status = serializer.validated_data["status"]
        freight.save(update_fields=["status", "updated_at"])

        FreightStatusHistory.objects.create(
            freight=freight,
            from_status=old_status,
            to_status=freight.status,
            changed_by=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(FreightSchedulingSerializer(freight).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_view(request):
    freights = FreightScheduling.objects.all()
    by_status = dict(
        freights.values("status").annotate(c=Count("status")).values_list("status", "c")
    )
    by_modality = dict(
        freights.values("modality").annotate(c=Count("modality")).values_list("modality", "c")
    )
    recent = freights.prefetch_related("items", "history").order_by("-created_at")[:5]
    return Response(
        {
            "total": freights.count(),
            "by_status": by_status,
            "by_modality": by_modality,
            "recent": FreightSchedulingSerializer(recent, many=True).data,
        }
    )
