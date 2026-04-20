<template>
  <div class="p-6 space-y-6 max-w-7xl">
    <DashboardHeaderBar :company="company" :wallet="sessionUser?.companyWallet ?? ''" />

    <div v-if="contractsStore.loading" class="text-sm text-text-muted py-8 text-center">
      Loading market data…
    </div>

    <div v-else-if="contractsStore.error" role="alert" class="rounded border border-danger-subtle bg-danger-subtle px-4 py-3 text-sm text-danger">
      {{ contractsStore.error }}
    </div>

    <template v-else>
      <DashboardMyImpact
        :total-mwh="contractsStore.totalMwh"
        :total-tco2e="contractsStore.totalTco2e"
      />

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 space-y-6">
          <DashboardAssetsTable :assets="contractsStore.assets" />
          <DashboardActivityTable :activity="contractsStore.activity" />
        </div>
        <div>
          <DashboardPortfolioPie :slices="contractsStore.portfolioSlices" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useContractsStore } from '~/stores/contracts'

useHead({ title: 'Dashboard' })

const authStore      = useAuthStore()
const contractsStore = useContractsStore()

const { sessionUser } = storeToRefs(authStore)

const company = computed(() =>
  sessionUser.value?.companyWallet
    ? contractsStore.companyForWallet(sessionUser.value.companyWallet)
    : undefined,
)
</script>
