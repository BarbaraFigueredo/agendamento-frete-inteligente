from django.contrib import admin

from .models import FreightItem, FreightScheduling, FreightStatusHistory


class FreightItemInline(admin.TabularInline):
    model = FreightItem
    extra = 0


class FreightHistoryInline(admin.TabularInline):
    model = FreightStatusHistory
    extra = 0
    readonly_fields = ["changed_at", "changed_by", "from_status", "to_status", "note"]

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(FreightScheduling)
class FreightAdmin(admin.ModelAdmin):
    list_display = ["id", "requester_name", "status", "modality", "scheduled_date", "created_at"]
    list_filter = ["status", "modality", "pickup_state"]
    search_fields = ["requester_name", "requester_cpf", "requester_email"]
    inlines = [FreightItemInline, FreightHistoryInline]
    readonly_fields = ["id", "created_at", "updated_at"]
