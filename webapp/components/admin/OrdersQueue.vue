<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <button
        v-for="f in filters"
        :key="f.value"
        class="px-3 py-1 rounded text-sm border transition-colors"
        :class="activeFilter === f.value
          ? 'bg-brand border-brand text-white'
          : 'border-border text-text-secondary hover:text-text-primary'"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
        <span class="ml-1 font-mono text-2xs">{{ countByStatus(f.value) }}</span>
      </button>
    </div>

    <div class="card">
      <div class="card-body p-0 overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Asset</th>
              <th>Side</th>
              <th>Type</th>
              <th class="text-right">Amount</th>
              <th>Status</th>
              <th>Placed</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="10" class="text-center text-text-muted py-10">No orders</td>
            </tr>
            <tr v-for="order in filtered" :key="order.id">
              <td class="font-mono">#{{ order.id }}</td>
              <td class="font-mono text-2xs text-text-muted">
                {{ (order.companyWallet as string).slice(0, 8) }}…
              </td>
              <td>
                <p class="font-medium">{{ order.abbreviation ?? '—' }}</p>
                <p class="text-2xs text-text-muted">{{ order.contractName ?? 'Any' }}</p>
              </td>
              <td>
                <span :class="order.side === 'buy' ? 'text-success font-semibold' : 'text-danger font-semibold'">
                  {{ (order.side as string).toUpperCase() }}
                </span>
              </td>
              <td class="capitalize">{{ order.orderType }}</td>
              <td class="numeric">{{ (order.amount as number).toLocaleString() }}</td>
              <td><span :class="`badge badge-${order.status}`">{{ order.status }}</span></td>
              <td class="whitespace-nowrap text-text-secondary">{{ formatDate(order.createdAt as Date) }}</td>
              <td class="text-text-secondary text-xs max-w-xs truncate">{{ order.notes ?? '—' }}</td>
              <td class="text-right pr-4">
                <template v-if="order.status === 'pending'">
                  <button
                    class="text-xs text-success hover:underline mr-2"
                    @click="updateOrder(order.id as number, 'executed')"
                  >
                    Execute
                  </button>
                  <button
                    class="text-xs text-danger hover:underline"
                    @click="updateOrder(order.id as number, 'cancelled')"
                  >
                    Cancel
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ orders: Record<string, unknown>[] }>()
const emit  = defineEmits<{ refresh: [] }>()

const activeFilter = ref('pending')

const filters = [
  { label: 'Pending',  value: 'pending' },
  { label: 'Executed', value: 'executed' },
  { label: 'Cancelled',value: 'cancelled' },
  { label: 'All',      value: '' },
]

const filtered = computed(() =>
  activeFilter.value
    ? props.orders.filter(o => o.status === activeFilter.value)
    : props.orders,
)

function countByStatus(status: string): number {
  return status ? props.orders.filter(o => o.status === status).length : props.orders.length
}

async function updateOrder(id: number, status: 'executed' | 'cancelled') {
  await $fetch(`/api/orders/${id}`, { method: 'PATCH', body: { status } })
  emit('refresh')
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
