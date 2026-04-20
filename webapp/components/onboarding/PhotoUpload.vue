<template>
  <div class="space-y-3">
    <!-- Drop zone -->
    <div
      class="relative flex flex-col items-center justify-center rounded border-2 border-dashed border-border bg-surface p-6 text-center transition-colors"
      :class="dragging ? 'border-brand bg-brand/5' : ''"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        class="absolute inset-0 opacity-0 cursor-pointer"
        @change="onFileChange"
      />
      <p class="text-sm text-text-muted">Drag & drop photos or <span class="text-brand cursor-pointer hover:underline">browse</span></p>
      <p class="text-2xs text-text-muted mt-1">JPG, PNG, WEBP — max 10 MB each</p>
    </div>

    <!-- Queue -->
    <div v-if="queue.length" class="space-y-2">
      <div
        v-for="(item, i) in queue"
        :key="i"
        class="flex items-center gap-3 rounded border border-border bg-surface px-3 py-2"
      >
        <!-- Thumb -->
        <img
          v-if="item.previewUrl"
          :src="item.previewUrl"
          class="h-10 w-10 shrink-0 rounded object-cover"
          alt=""
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm truncate text-text-primary">{{ item.file.name }}</p>
          <p v-if="item.status === 'pending'" class="text-2xs text-text-muted">Ready to upload</p>
          <p v-else-if="item.status === 'uploading'" class="text-2xs text-brand animate-pulse">Uploading…</p>
          <p v-else-if="item.status === 'done'" class="text-2xs text-success">Uploaded</p>
          <p v-else-if="item.status === 'error'" class="text-2xs text-danger">{{ item.error }}</p>
        </div>
        <!-- Caption -->
        <input
          v-if="item.status === 'done'"
          v-model="item.caption"
          type="text"
          class="rex-input w-36 shrink-0 text-2xs"
          placeholder="Caption (optional)"
          @input="emitValue"
        />
        <button type="button" class="px-2 py-1 text-xs text-danger hover:underline shrink-0 rounded" @click="removeItem(i)">Remove</button>
      </div>
    </div>

    <!-- Upload all button -->
    <button
      v-if="hasPending"
      type="button"
      :disabled="uploading"
      class="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      @click="uploadAll"
    >
      {{ uploading ? 'Uploading…' : `Upload ${pendingCount} photo${pendingCount !== 1 ? 's' : ''}` }}
    </button>
  </div>
</template>

<script setup lang="ts">
export interface PhotoEntry {
  url:     string
  caption: string
}

const props = defineProps<{
  folder:     string   // e.g. 'onboarding/equipment-photos'
  modelValue: PhotoEntry[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PhotoEntry[]]
}>()

interface QueueItem {
  file:       File
  previewUrl: string
  status:     'pending' | 'uploading' | 'done' | 'error'
  publicUrl:  string
  caption:    string
  error:      string
}

const fileInput = ref<HTMLInputElement | null>(null)
const dragging  = ref(false)
const uploading = ref(false)
const queue     = ref<QueueItem[]>([])

const hasPending   = computed(() => queue.value.some(i => i.status === 'pending'))
const pendingCount = computed(() => queue.value.filter(i => i.status === 'pending').length)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'))
  addFiles(files)
}

function addFiles(files: File[]) {
  for (const f of files) {
    if (f.size > 10 * 1024 * 1024) continue
    queue.value.push({
      file:       f,
      previewUrl: URL.createObjectURL(f),
      status:     'pending',
      publicUrl:  '',
      caption:    '',
      error:      '',
    })
  }
}

function removeItem(index: number) {
  const item = queue.value[index]
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
  queue.value.splice(index, 1)
  emitValue()
}

async function uploadAll() {
  uploading.value = true
  const pending = queue.value.filter(i => i.status === 'pending')
  await Promise.allSettled(pending.map(uploadItem))
  uploading.value = false
  emitValue()
}

async function uploadItem(item: QueueItem) {
  item.status = 'uploading'
  try {
    const { uploadUrl, publicUrl } = await $fetch<{ uploadUrl: string; publicUrl: string }>('/api/uploads/presign', {
      method: 'POST',
      body: {
        folder:      props.folder,
        filename:    item.file.name,
        contentType: item.file.type,
      },
    })
    await fetch(uploadUrl, {
      method:  'PUT',
      headers: { 'Content-Type': item.file.type },
      body:    item.file,
    })
    item.publicUrl = publicUrl
    item.status    = 'done'
  } catch (e: unknown) {
    item.error  = (e as { statusMessage?: string })?.statusMessage ?? 'Upload failed'
    item.status = 'error'
  }
}

function emitValue() {
  emit('update:modelValue', queue.value
    .filter(i => i.status === 'done')
    .map(i => ({ url: i.publicUrl, caption: i.caption })),
  )
}
</script>

