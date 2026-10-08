<template>
	<div class="media-editor">
		<div v-if="value" class="preview-card">
			<div class="preview-stage">
				<img v-if="previewUrl" :src="previewUrl" :alt="fileName || '产品图片'" />
				<div v-else class="preview-loading">正在加载预览…</div>
			</div>
			<div class="file-meta">
				<strong>{{ fileName || '已上传图片' }}</strong>
				<span v-if="fileInfo">{{ fileInfo }}</span>
			</div>
			<button type="button" class="text-button" :disabled="disabled" @click="clearFile">清除图片</button>
		</div>
		<div v-else class="empty-state">
			<div class="empty-icon">图片</div>
			<div>
				<strong>还没有图片</strong>
				<span>上传后会在这里显示大图预览</span>
			</div>
		</div>
		<label class="upload-button" :class="{ disabled }">
			<span>{{ value ? '替换图片' : '上传图片' }}</span>
			<input type="file" accept="image/*" :disabled="disabled || uploading" @change="uploadFile" />
		</label>
		<p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
	</div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';

export default {
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const api = useApi();
		const fileName = ref('');
		const fileInfo = ref('');
		const uploading = ref(false);
		const errorMessage = ref('');
		const previewUrl = computed(() => props.value ? `/assets/${encodeURIComponent(props.value)}?width=960&fit=inside&quality=85` : '');

		watch(() => props.value, loadFile, { immediate: true });

		return { fileName, fileInfo, previewUrl, uploading, errorMessage, uploadFile, clearFile };

		async function loadFile(value) {
			fileName.value = '';
			fileInfo.value = '';
			if (!value) return;
			try {
				const response = await api.get(`/files/${encodeURIComponent(value)}`);
				const file = response.data?.data;
				fileName.value = file?.filename_download || file?.title || value;
				fileInfo.value = [file?.width && file?.height ? `${file.width} × ${file.height}` : '', file?.filesize ? formatSize(file.filesize) : '']
					.filter(Boolean).join(' · ');
			} catch {
				fileName.value = value;
			}
		}

		async function uploadFile(event) {
			const file = event.target.files?.[0];
			event.target.value = '';
			if (!file) return;
			errorMessage.value = '';
			uploading.value = true;
			try {
				const form = new FormData();
				form.append('file', file);
				const response = await api.post('/files', form);
				emit('input', response.data?.data?.id || null);
			} catch (error) {
				errorMessage.value = error?.response?.data?.errors?.[0]?.message || '图片上传失败，请重试';
			} finally {
				uploading.value = false;
			}
		}

		function clearFile() {
			errorMessage.value = '';
			emit('input', null);
		}

		function formatSize(value) {
			if (value < 1024) return `${value} B`;
			if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
			return `${(value / 1024 / 1024).toFixed(1)} MB`;
		}
	},
};
</script>

<style scoped>
.media-editor { display: grid; gap: 12px; }
.preview-card { display: grid; grid-template-columns: 160px 1fr auto; align-items: center; gap: 14px; padding: 12px; border: 1px solid var(--theme--border-color); border-radius: 8px; background: var(--theme--background-subdued); }
.preview-stage { width: 160px; height: 120px; display: grid; place-items: center; overflow: hidden; border-radius: 6px; background: white; }
.preview-stage img { width: 100%; height: 100%; object-fit: contain; }
.preview-loading { color: var(--theme--foreground-subdued); font-size: 12px; }
.file-meta { min-width: 0; display: grid; gap: 4px; }
.file-meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-meta span { color: var(--theme--foreground-subdued); font-size: 12px; }
.empty-state { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px dashed var(--theme--border-color); border-radius: 8px; color: var(--theme--foreground-subdued); }
.empty-state strong, .empty-state span { display: block; }
.empty-state span { margin-top: 4px; font-size: 12px; }
.empty-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 8px; background: var(--theme--primary); color: white; font-size: 11px; }
.upload-button { justify-self: start; position: relative; overflow: hidden; display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 6px; background: var(--theme--primary); color: white; cursor: pointer; font-weight: 600; }
.upload-button.disabled { opacity: .5; cursor: not-allowed; }
.upload-button input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.text-button { border: 0; background: transparent; color: var(--theme--danger); cursor: pointer; white-space: nowrap; }
.text-button:disabled { opacity: .5; cursor: not-allowed; }
.error-message { margin: 0; color: var(--theme--danger); font-size: 12px; }
@media (max-width: 700px) { .preview-card { grid-template-columns: 1fr; } .preview-stage { width: 100%; height: 180px; } }
</style>
