<template>
	<div class="media-editor">
		<div v-if="value" class="preview-card">
			<button type="button" class="preview-stage" :disabled="!previewUrl || previewFailed" @click="openCurrentLightbox">
				<img
					v-if="previewUrl && !previewFailed"
					:src="previewUrl"
					:alt="fileName || '产品图片'"
					referrerpolicy="no-referrer"
					@error="previewFailed = true"
				/>
				<div v-else-if="previewFailed" class="preview-loading">无法加载预览，请检查图片地址</div>
				<div v-else class="preview-loading">正在加载预览…</div>
			</button>
			<div class="file-meta">
				<strong>{{ fileName || '已上传图片' }}</strong>
				<span v-if="fileInfo">{{ fileInfo }}</span>
				<span v-if="previewUrl && !previewFailed">点击图片可放大查看</span>
			</div>
			<button type="button" class="text-button" :disabled="disabled" @click="clearFile">清除图片</button>
		</div>
		<div v-else class="empty-state">
			<div class="empty-icon">图片</div>
			<div>
				<strong>还没有图片</strong>
				<span>上传或从媒体库选择后会在这里显示大图预览</span>
			</div>
		</div>
		<div class="actions">
			<label class="upload-button" :class="{ disabled }">
				<span>{{ value ? '从本地替换' : '上传图片' }}</span>
				<input type="file" accept="image/*" :disabled="disabled || uploading" @change="uploadFile" />
			</label>
			<button type="button" class="library-button" :disabled="disabled || uploading" @click="openLibrary">
				{{ value ? '从媒体库替换' : '从媒体库选择' }}
			</button>
		</div>
		<p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
		<Teleport to="body">
		<div v-if="libraryOpen" class="overlay" @click.self="closeLibrary">
			<div class="library-panel" role="dialog" aria-label="从媒体库选择">
				<header class="library-header">
					<strong>从媒体库选择</strong>
					<input
						v-model="librarySearch"
						class="library-search"
						type="search"
						placeholder="搜索文件名"
						@input="onSearchInput"
					/>
					<button type="button" class="ghost-button" @click="closeLibrary">关闭</button>
				</header>
				<p class="library-hint">先点图片放大看清，再用「使用这张图」。小卡片上的「使用」会直接选中。</p>
				<div v-if="libraryLoading && libraryFiles.length === 0" class="preview-loading">正在加载媒体库…</div>
				<div v-else-if="libraryFiles.length === 0" class="preview-loading">没有找到图片</div>
				<div v-else class="library-grid">
					<article v-for="file in libraryFiles" :key="file.id" class="library-card">
						<button type="button" class="library-thumb" @click="openLightbox(file)">
							<img :src="thumbUrl(file.id)" :alt="file.filename_download || '图片'" referrerpolicy="no-referrer" />
						</button>
						<p class="library-name">{{ file.filename_download || file.title || file.id }}</p>
						<button type="button" class="use-button" @click="selectFromLibrary(file.id)">使用</button>
					</article>
				</div>
				<button v-if="libraryHasMore" type="button" class="library-button" :disabled="libraryLoading" @click="loadMore">
					{{ libraryLoading ? '加载中…' : '加载更多' }}
				</button>
			</div>
		</div>
		<div v-if="lightbox" class="overlay lightbox" @click.self="closeLightbox">
			<div class="lightbox-panel" role="dialog" aria-label="图片放大预览">
				<img :src="lightbox.src" :alt="lightbox.name" referrerpolicy="no-referrer" />
				<div class="lightbox-bar">
					<span>{{ lightbox.name }}</span>
					<div class="actions">
						<button v-if="lightbox.id" type="button" class="upload-button" @click="selectFromLibrary(lightbox.id)">
							使用这张图
						</button>
						<button type="button" class="ghost-button" @click="closeLightbox">关闭</button>
					</div>
				</div>
			</div>
		</div>
		</Teleport>
	</div>
</template>

<script>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { resolvePreviewUrl } from './previewUrl.js';

const PAGE_SIZE = 40;

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
		const previewFailed = ref(false);
		const libraryOpen = ref(false);
		const librarySearch = ref('');
		const libraryFiles = ref([]);
		const libraryPage = ref(1);
		const libraryHasMore = ref(false);
		const libraryLoading = ref(false);
		const lightbox = ref(null);
		let searchTimer = null;
		const previewUrl = computed(() => resolvePreviewUrl(props.value));

		watch(
			() => props.value,
			(value) => {
				previewFailed.value = false;
				loadFile(value);
			},
			{ immediate: true },
		);

		watch(libraryOpen, (open) => {
			if (open) {
				window.addEventListener('keydown', onKeydown);
			} else {
				window.removeEventListener('keydown', onKeydown);
			}
		});

		onBeforeUnmount(() => {
			window.removeEventListener('keydown', onKeydown);
			clearTimeout(searchTimer);
		});

		return {
			fileName,
			fileInfo,
			previewUrl,
			previewFailed,
			uploading,
			errorMessage,
			libraryOpen,
			librarySearch,
			libraryFiles,
			libraryHasMore,
			libraryLoading,
			lightbox,
			uploadFile,
			clearFile,
			openLibrary,
			closeLibrary,
			selectFromLibrary,
			openCurrentLightbox,
			openLightbox,
			closeLightbox,
			onSearchInput,
			loadMore,
			thumbUrl,
		};

		function thumbUrl(id) {
			return resolvePreviewUrl(id, { width: 360, height: 360, fit: 'cover' });
		}

		function largeUrl(id) {
			return resolvePreviewUrl(id, { width: 1600, fit: 'inside' });
		}

		async function loadFile(value) {
			fileName.value = '';
			fileInfo.value = '';
			if (!value) return;
			if (/^https?:\/\//i.test(value)) {
				fileName.value = value.split('/').pop() || value;
				fileInfo.value = '外部图片地址';
				return;
			}
			if (value.startsWith('/') && !value.startsWith('//')) {
				fileName.value = value.split('/').pop() || value;
				fileInfo.value = '站点图片';
				return;
			}
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

		async function openLibrary() {
			if (props.disabled || uploading.value) return;
			errorMessage.value = '';
			libraryOpen.value = true;
			librarySearch.value = '';
			libraryPage.value = 1;
			libraryFiles.value = [];
			await loadLibrary(true);
		}

		function closeLibrary() {
			libraryOpen.value = false;
			lightbox.value = null;
		}

		function onSearchInput() {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(() => {
				libraryPage.value = 1;
				loadLibrary(true);
			}, 250);
		}

		function loadMore() {
			libraryPage.value += 1;
			loadLibrary(false);
		}

		async function loadLibrary(replace) {
			libraryLoading.value = true;
			try {
				const params = {
					'filter[type][_starts_with]': 'image/',
					sort: '-uploaded_on',
					limit: String(PAGE_SIZE),
					page: String(libraryPage.value),
					fields: 'id,filename_download,title,type,width,height,filesize',
					meta: 'filter_count',
				};
				const keyword = librarySearch.value.trim();
				if (keyword) params['filter[filename_download][_icontains]'] = keyword;
				const response = await api.get('/files', { params });
				const items = response.data?.data ?? [];
				libraryFiles.value = replace ? items : [...libraryFiles.value, ...items];
				const total = Number(response.data?.meta?.filter_count ?? libraryFiles.value.length);
				libraryHasMore.value = libraryFiles.value.length < total;
			} catch {
				errorMessage.value = '媒体库加载失败，请重试';
			} finally {
				libraryLoading.value = false;
			}
		}

		function selectFromLibrary(id) {
			if (!id) return;
			errorMessage.value = '';
			lightbox.value = null;
			libraryOpen.value = false;
			emit('input', String(id));
		}

		function openCurrentLightbox() {
			if (!props.value || !previewUrl.value || previewFailed.value) return;
			lightbox.value = {
				id: null,
				src: resolvePreviewUrl(props.value, { width: 1600, fit: 'inside' }),
				name: fileName.value || '图片预览',
			};
		}

		function openLightbox(file) {
			lightbox.value = {
				id: file.id,
				src: largeUrl(file.id),
				name: file.filename_download || file.title || '图片预览',
			};
		}

		function closeLightbox() {
			lightbox.value = null;
		}

		function onKeydown(event) {
			if (event.key !== 'Escape') return;
			if (lightbox.value) {
				closeLightbox();
				return;
			}
			closeLibrary();
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
.preview-card { display: grid; grid-template-columns: 280px minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 12px; border: 1px solid var(--theme--border-color); border-radius: 8px; background: var(--theme--background-subdued); }
.preview-stage { width: 280px; height: 190px; display: grid; place-items: center; overflow: hidden; border: 0; padding: 0; border-radius: 6px; background: white; cursor: zoom-in; }
.preview-stage:disabled { cursor: default; }
.preview-stage img { width: 100%; height: 100%; object-fit: contain; }
.preview-loading { color: var(--theme--foreground-subdued); font-size: 12px; }
.file-meta { min-width: 0; display: grid; gap: 4px; }
.file-meta strong { overflow-wrap: anywhere; word-break: break-word; }
.file-meta span { color: var(--theme--foreground-subdued); font-size: 12px; }
.empty-state { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px dashed var(--theme--border-color); border-radius: 8px; color: var(--theme--foreground-subdued); }
.empty-state strong, .empty-state span { display: block; }
.empty-state span { margin-top: 4px; font-size: 12px; }
.empty-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 8px; background: var(--theme--primary); color: white; font-size: 11px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
.upload-button { justify-self: start; position: relative; overflow: hidden; display: inline-flex; align-items: center; padding: 8px 14px; border: 0; border-radius: 6px; background: var(--theme--primary); color: white; cursor: pointer; font-weight: 600; }
.upload-button.disabled { opacity: .5; cursor: not-allowed; }
.upload-button input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.library-button, .ghost-button, .use-button { display: inline-flex; align-items: center; padding: 8px 14px; border: 1px solid var(--theme--border-color); border-radius: 6px; background: var(--theme--background); color: var(--theme--foreground); cursor: pointer; font-weight: 600; }
.library-button:disabled { opacity: .5; cursor: not-allowed; }
.text-button { border: 0; background: transparent; color: var(--theme--danger); cursor: pointer; white-space: nowrap; }
.text-button:disabled { opacity: .5; cursor: not-allowed; }
.error-message { margin: 0; color: var(--theme--danger); font-size: 12px; }
.overlay { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; padding: 24px; background: rgb(15 23 32 / 0.72); }
.library-panel { display: grid; gap: 12px; width: min(960px, 100%); max-height: 90vh; overflow: auto; padding: 16px; border-radius: 10px; background: var(--theme--background); color: var(--theme--foreground); }
.library-header { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.library-header strong { margin-right: auto; }
.library-search { min-width: 180px; flex: 1; padding: 8px 10px; border: 1px solid var(--theme--border-color); border-radius: 6px; background: var(--theme--background-subdued); color: inherit; }
.library-hint { margin: 0; color: var(--theme--foreground-subdued); font-size: 12px; }
.library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.library-card { display: grid; gap: 8px; }
.library-thumb { height: 140px; padding: 0; border: 1px solid var(--theme--border-color); border-radius: 8px; overflow: hidden; background: white; cursor: zoom-in; }
.library-thumb img { width: 100%; height: 100%; object-fit: contain; }
.library-name { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.use-button { justify-self: start; padding: 6px 10px; font-size: 12px; }
.lightbox { z-index: 10000; }
.lightbox-panel { display: grid; gap: 12px; width: min(1100px, 100%); max-height: 92vh; }
.lightbox-panel img { width: 100%; max-height: 78vh; object-fit: contain; background: #111; border-radius: 8px; }
.lightbox-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; color: white; }
@media (max-width: 700px) { .preview-card { grid-template-columns: 1fr; } .preview-stage { width: 100%; height: 180px; } }
</style>
