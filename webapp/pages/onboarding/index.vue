<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <NuxtLink to="/dashboard/generator" class="text-sm text-text-secondary hover:text-text-primary">
        ← Back
      </NuxtLink>
      <h1 class="font-display text-2xl font-semibold text-text-primary">New project onboarding</h1>
    </div>

    <!-- Submission complete -->
    <template v-if="submitted">
      <div class="card card-body text-center space-y-3 py-12">
        <div class="text-4xl">✓</div>
        <h2 class="font-display text-xl font-semibold text-text-primary">Submission received</h2>
        <p class="text-sm text-text-secondary max-w-sm mx-auto">
          Your project has been submitted for review. REX staff will assess your submission and contact you within 5 business days.
        </p>
        <NuxtLink
          to="/dashboard/generator"
          class="inline-block mt-4 rounded bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Back to dashboard
        </NuxtLink>
      </div>
    </template>

    <!-- Main form -->
    <template v-else>
      <!-- Step indicator -->
      <nav aria-label="Onboarding steps">
        <ol class="flex items-center gap-0" role="list">
          <template v-for="(step, idx) in steps" :key="idx">
            <li class="flex items-center">
              <button
                class="flex items-center gap-2 px-3 py-2 text-sm transition-colors motion-reduce:transition-none"
                :class="currentStep === idx
                  ? 'text-brand font-semibold'
                  : idx < currentStep
                    ? 'text-text-secondary'
                    : 'text-text-muted cursor-default'"
                :disabled="idx > currentStep"
                :aria-current="currentStep === idx ? 'step' : undefined"
                :aria-label="`Step ${idx + 1} of ${steps.length}: ${step.label}${idx < currentStep ? ' (completed)' : idx === currentStep ? ' (current)' : ''}`"
                @click="idx <= currentStep && (currentStep = idx)"
              >
                <span
                  class="w-6 h-6 rounded-full text-2xs font-bold flex items-center justify-center border"
                  :class="idx < currentStep
                    ? 'bg-brand border-brand text-white'
                    : idx === currentStep
                      ? 'border-brand text-brand'
                      : 'border-border text-text-muted'"
                  aria-hidden="true"
                >
                  {{ idx < currentStep ? '✓' : idx + 1 }}
                </span>
                {{ step.label }}
              </button>
            </li>
            <li v-if="idx < steps.length - 1" class="flex-1 h-px bg-border min-w-4" aria-hidden="true" />
          </template>
        </ol>
      </nav>

      <!-- Step content -->
      <div class="card">
        <div class="card-header">
          <h2 class="font-display text-lg font-semibold">{{ steps[currentStep]?.label }}</h2>
          <span class="text-sm text-text-muted">Step {{ currentStep + 1 }} of {{ steps.length }}</span>
        </div>
        <div class="card-body space-y-5">

          <!-- Step 1: Project info -->
          <template v-if="currentStep === 0">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Project name</label>
                <input v-model="form.projectName" type="text" class="rex-input w-full" placeholder="e.g. Kisegi Solar Farm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Project type</label>
                <select v-model="form.projectType" class="rex-select w-full">
                  <option value="">Select type</option>
                  <option value="Utility">Utility</option>
                  <option value="Grid-Connected C&I">Grid-Connected C&amp;I</option>
                  <option value="Off-Grid Mini-Grid/Mesh-Grid">Off-Grid Mini-Grid/Mesh-Grid</option>
                  <option value="Home System">Home System</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Expected annual generation (MWh)</label>
                <input v-model.number="form.expectedAnnualGeneration" type="number" min="0" step="0.001" class="rex-input w-full" />
              </div>
            </div>
          </template>

          <!-- Step 2: Generation type -->
          <template v-if="currentStep === 1">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Primary energy source</label>
                <select v-model="form.genGenerationType" class="rex-select w-full">
                  <option value="">Select source</option>
                  <option value="solar">Solar</option>
                  <option value="wind">Wind</option>
                  <option value="hydro">Hydro</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <!-- Secondary source -->
              <div v-if="!showSecondary">
                <button type="button" class="text-sm text-brand hover:underline" @click="showSecondary = true">
                  + Add secondary energy source
                </button>
              </div>
              <template v-else>
                <div class="space-y-3 rounded border border-border p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-text-secondary">Secondary energy source</span>
                    <button type="button" class="text-xs text-danger hover:underline" @click="removeSecondary">Remove</button>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-text-secondary mb-1">Source type</label>
                    <input v-model="form.genSecondarySrc" type="text" class="rex-input w-full" placeholder="e.g. Diesel, Grid, Wind" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-text-secondary mb-1">Short description</label>
                    <input v-model="form.genSecondaryDesc" type="text" class="rex-input w-full" placeholder="Brief description" />
                  </div>
                </div>

                <!-- Tertiary source -->
                <div v-if="!showTertiary">
                  <button type="button" class="text-sm text-brand hover:underline" @click="showTertiary = true">
                    + Add tertiary energy source
                  </button>
                </div>
                <div v-else class="space-y-3 rounded border border-border p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-text-secondary">Tertiary energy source</span>
                    <button type="button" class="text-xs text-danger hover:underline" @click="removeTertiary">Remove</button>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-text-secondary mb-1">Source type</label>
                    <input v-model="form.genTertiarySrc" type="text" class="rex-input w-full" placeholder="e.g. Diesel, Grid, Wind" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-text-secondary mb-1">Short description</label>
                    <input v-model="form.genTertiaryDesc" type="text" class="rex-input w-full" placeholder="Brief description" />
                  </div>
                </div>
              </template>

              <OnboardingDocUpload
                v-model:document-type="form.genDocType"
                v-model:document-url="form.genDocUrl"
                folder="onboarding/generation-type"
                :previous-docs="previousDocs(1)"
              />
            </div>
          </template>

          <!-- Step 3: Capacity -->
          <template v-if="currentStep === 2">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Installed capacity (kWp)</label>
                <input v-model.number="form.capCapacity" type="number" min="0" step="0.001" class="rex-input w-full" />
              </div>
              <OnboardingDocUpload
                v-model:document-type="form.capDocType"
                v-model:document-url="form.capDocUrl"
                folder="onboarding/capacity"
                :previous-docs="previousDocs(2)"
              />
            </div>
          </template>

          <!-- Step 4: Location -->
          <template v-if="currentStep === 3">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">
                  Physical address
                  <span class="ml-1 font-normal text-text-muted">(optional)</span>
                </label>
                <input v-model="form.locPhysicalAddress" type="text" class="rex-input w-full" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-secondary mb-1">Latitude</label>
                  <input
                    v-model="form.locLatStr"
                    type="text"
                    inputmode="decimal"
                    class="rex-input w-full"
                    :class="latError ? 'border-danger' : ''"
                    placeholder="e.g. -0.12"
                    @blur="validateLatLon"
                  />
                  <p v-if="latError" class="mt-1 text-xs text-danger">{{ latError }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-secondary mb-1">Longitude</label>
                  <input
                    v-model="form.locLonStr"
                    type="text"
                    inputmode="decimal"
                    class="rex-input w-full"
                    :class="lonError ? 'border-danger' : ''"
                    placeholder="e.g. 34.57"
                    @blur="validateLatLon"
                  />
                  <p v-if="lonError" class="mt-1 text-xs text-danger">{{ lonError }}</p>
                </div>
              </div>
              <OnboardingDocUpload
                v-model:document-type="form.locDocType"
                v-model:document-url="form.locDocUrl"
                folder="onboarding/location"
                :previous-docs="previousDocs(3)"
              />
            </div>
          </template>

          <!-- Step 5: Date of first operation -->
          <template v-if="currentStep === 4">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Date of first operation</label>
                <input v-model="form.dateDateOfFirstOperation" type="date" class="rex-input w-60" />
              </div>
              <p class="text-sm text-text-muted">
                If commissioning documentation is unavailable, an owner declaration with metering data showing initial generation is acceptable per the R-REC Standard.
              </p>
              <OnboardingDocUpload
                v-model:document-type="form.dateDocType"
                v-model:document-url="form.dateDocUrl"
                folder="onboarding/date-of-first-operation"
                :allow-owner-declaration="true"
                :previous-docs="previousDocs(4)"
              />
            </div>
          </template>

          <!-- Step 6: Generation equipment photos -->
          <template v-if="currentStep === 5">
            <div class="space-y-4">
              <p class="text-sm text-text-secondary">
                Upload clear photographs of installed generation equipment (panels, turbines, inverters).
                At least one photo required.
              </p>
              <OnboardingPhotoUpload
                v-model="form.photosGen"
                folder="onboarding/equipment-photos"
                label="generation equipment"
              />
            </div>
          </template>

          <!-- Step 7: Metering photos -->
          <template v-if="currentStep === 6">
            <div class="space-y-4">
              <p class="text-sm text-text-secondary">
                Upload clear photographs of all metering and monitoring equipment.
              </p>
              <OnboardingPhotoUpload
                v-model="form.photosMeter"
                folder="onboarding/metering-photos"
                label="metering equipment"
              />
            </div>
          </template>

        </div>

        <!-- Navigation -->
        <div class="px-5 py-4 border-t border-border flex items-center justify-between">
          <button
            v-if="currentStep > 0"
            class="rounded border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            @click="currentStep--"
          >
            Previous
          </button>
          <span v-else />

          <div class="flex flex-col items-end gap-2">
            <p v-if="submitError && currentStep === steps.length - 1" role="alert" aria-live="assertive" class="text-xs text-danger text-right">
              {{ submitError }}
            </p>
            <div class="flex gap-3">
              <button
                class="rounded border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                :disabled="saving"
                @click="saveDraft"
              >
                Save draft
              </button>
              <button
                v-if="currentStep < steps.length - 1"
                class="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                @click="currentStep++"
              >
                Continue
              </button>
              <button
                v-else
                class="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                :disabled="saving"
                @click="submitForm"
              >
                {{ saving ? 'Submitting…' : 'Submit for review' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Project Onboarding' })

const steps = [
  { label: 'Project info' },
  { label: 'Generation type' },
  { label: 'Capacity' },
  { label: 'Location' },
  { label: 'First operation' },
  { label: 'Equipment photos' },
  { label: 'Metering photos' },
]

const currentStep = ref(0)
const saving      = ref(false)
const submitted   = ref(false)
const draftId     = ref<number | null>(null)

// UI toggles for secondary/tertiary sources
const showSecondary = ref(false)
const showTertiary  = ref(false)

// Lat/lon are kept as strings until submitted so we can validate precision
const latError    = ref('')
const lonError    = ref('')
const submitError = ref('')

// Form state — mirrors new flat schema columns
const form = reactive({
  // Step 1 — Project info
  projectName:              '',
  projectType:              '',
  expectedAnnualGeneration: null as number | null,

  // Step 2 — Generation type
  genGenerationType: '',
  genDocUrl:         '',
  genDocType:        '',
  genSecondarySrc:   '',
  genSecondaryDesc:  '',
  genTertiarySrc:    '',
  genTertiaryDesc:   '',

  // Step 3 — Capacity
  capCapacity: null as number | null,
  capDocUrl:   '',
  capDocType:  '',

  // Step 4 — Location
  locPhysicalAddress: '',
  locLatStr:          '',   // string for precision validation
  locLonStr:          '',
  locDocUrl:          '',
  locDocType:         '',

  // Step 5 — Date of first operation
  dateDateOfFirstOperation: '',
  dateDocUrl:               '',
  dateDocType:              '',

  // Steps 6 & 7 — Photos
  photosGen:   [] as Array<{ url: string; caption: string }>,
  photosMeter: [] as Array<{ url: string; caption: string }>,
})

function removeSecondary() {
  showSecondary.value    = false
  showTertiary.value     = false
  form.genSecondarySrc   = ''
  form.genSecondaryDesc  = ''
  form.genTertiarySrc    = ''
  form.genTertiaryDesc   = ''
}

function removeTertiary() {
  showTertiary.value   = false
  form.genTertiarySrc  = ''
  form.genTertiaryDesc = ''
}

function hasTwoDecimals(str: string): boolean {
  const dot = str.indexOf('.')
  return dot !== -1 && str.length - dot - 1 >= 2
}

function validateLatLon() {
  latError.value = ''
  lonError.value = ''
  if (form.locLatStr && !hasTwoDecimals(form.locLatStr)) {
    latError.value = 'At least 2 decimal places required'
  }
  if (form.locLonStr && !hasTwoDecimals(form.locLonStr)) {
    lonError.value = 'At least 2 decimal places required'
  }
}

/** Returns the list of already-uploaded docs from all earlier doc steps. */
function previousDocs(forStep: number): Array<{ label: string; docUrl: string; docType: string }> {
  const docs: Array<{ label: string; docUrl: string; docType: string }> = []
  if (forStep > 1 && form.genDocUrl && form.genDocType) {
    docs.push({ label: form.genDocType, docUrl: form.genDocUrl, docType: form.genDocType })
  }
  if (forStep > 2 && form.capDocUrl && form.capDocType) {
    docs.push({ label: form.capDocType, docUrl: form.capDocUrl, docType: form.capDocType })
  }
  if (forStep > 3 && form.locDocUrl && form.locDocType) {
    docs.push({ label: form.locDocType, docUrl: form.locDocUrl, docType: form.locDocType })
  }
  return docs
}

/** Build the API payload from form state. */
function buildPayload(status: 'draft' | 'pending') {
  validateLatLon()
  return {
    status,
    projectName:              form.projectName || undefined,
    projectType:              form.projectType || undefined,
    expectedAnnualGeneration: form.expectedAnnualGeneration ?? undefined,
    genGenerationType:        form.genGenerationType || undefined,
    genDocUrl:                form.genDocUrl || undefined,
    genDocType:               form.genDocType || undefined,
    genSecondarySrc:          form.genSecondarySrc || undefined,
    genSecondaryDesc:         form.genSecondaryDesc || undefined,
    genTertiarySrc:           form.genTertiarySrc || undefined,
    genTertiaryDesc:          form.genTertiaryDesc || undefined,
    capCapacity:              form.capCapacity ?? undefined,
    capDocUrl:                form.capDocUrl || undefined,
    capDocType:               form.capDocType || undefined,
    locPhysicalAddress:       form.locPhysicalAddress || undefined,
    locLat:                   form.locLatStr ? parseFloat(form.locLatStr) : undefined,
    locLon:                   form.locLonStr ? parseFloat(form.locLonStr) : undefined,
    locDocUrl:                form.locDocUrl || undefined,
    locDocType:               form.locDocType || undefined,
    dateDateOfFirstOperation: form.dateDateOfFirstOperation || undefined,
    dateDocUrl:               form.dateDocUrl || undefined,
    dateDocType:              form.dateDocType || undefined,
    photosGen:                form.photosGen.length  ? form.photosGen  : undefined,
    photosMeter:              form.photosMeter.length ? form.photosMeter : undefined,
  }
}

async function saveDraft() {
  saving.value = true
  try {
    const payload = buildPayload('draft')
    if (draftId.value) {
      await $fetch(`/api/onboarding/${draftId.value}`, { method: 'PATCH', body: payload })
    } else {
      const resp = await $fetch('/api/onboarding', { method: 'POST', body: payload })
      draftId.value = (resp as { submission: { id: number } }).submission.id
    }
  } finally {
    saving.value = false
  }
}

function validateSubmit(): string {
  if (!form.projectName?.trim())       return 'Project name is required (step 1)'
  if (!form.projectType)               return 'Project type is required (step 1)'
  if (!form.genGenerationType)         return 'Primary energy source is required (step 2)'
  if (!form.capCapacity)               return 'Installed capacity is required (step 3)'
  if (!form.locLatStr || !form.locLonStr) return 'Latitude and longitude are required (step 4)'
  if (!form.dateDateOfFirstOperation)  return 'Date of first operation is required (step 5)'
  if (form.photosGen.length === 0)     return 'At least one equipment photo is required (step 6)'
  return ''
}

async function submitForm() {
  validateLatLon()
  submitError.value = ''
  const validationMsg = validateSubmit()
  if (validationMsg) {
    submitError.value = validationMsg
    return
  }
  if (latError.value || lonError.value) return
  saving.value = true
  try {
    const payload = buildPayload('pending')
    if (draftId.value) {
      await $fetch(`/api/onboarding/${draftId.value}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/onboarding', { method: 'POST', body: payload })
    }
    submitted.value = true
  } finally {
    saving.value = false
  }
}
</script>

