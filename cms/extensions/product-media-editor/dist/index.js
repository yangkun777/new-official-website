import { openBlock, createElementBlock, createElementVNode, toDisplayString, createCommentVNode, normalizeClass, ref, computed, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';

var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=true===r.prepend?"prepend":"append",d=true===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

var css = "\n.media-editor[data-v-b47ff273] { display: grid; gap: 12px;\n}\n.preview-card[data-v-b47ff273] { display: grid; grid-template-columns: 280px minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 12px; border: 1px solid var(--theme--border-color); border-radius: 8px; background: var(--theme--background-subdued);\n}\n.preview-stage[data-v-b47ff273] { width: 280px; height: 190px; display: grid; place-items: center; overflow: hidden; border-radius: 6px; background: white;\n}\n.preview-stage img[data-v-b47ff273] { width: 100%; height: 100%; object-fit: contain;\n}\n.preview-loading[data-v-b47ff273] { color: var(--theme--foreground-subdued); font-size: 12px;\n}\n.file-meta[data-v-b47ff273] { min-width: 0; display: grid; gap: 4px;\n}\n.file-meta strong[data-v-b47ff273] { overflow-wrap: anywhere; word-break: break-word;\n}\n.file-meta span[data-v-b47ff273] { color: var(--theme--foreground-subdued); font-size: 12px;\n}\n.empty-state[data-v-b47ff273] { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px dashed var(--theme--border-color); border-radius: 8px; color: var(--theme--foreground-subdued);\n}\n.empty-state strong[data-v-b47ff273], .empty-state span[data-v-b47ff273] { display: block;\n}\n.empty-state span[data-v-b47ff273] { margin-top: 4px; font-size: 12px;\n}\n.empty-icon[data-v-b47ff273] { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 8px; background: var(--theme--primary); color: white; font-size: 11px;\n}\n.upload-button[data-v-b47ff273] { justify-self: start; position: relative; overflow: hidden; display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 6px; background: var(--theme--primary); color: white; cursor: pointer; font-weight: 600;\n}\n.upload-button.disabled[data-v-b47ff273] { opacity: .5; cursor: not-allowed;\n}\n.upload-button input[data-v-b47ff273] { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;\n}\n.text-button[data-v-b47ff273] { border: 0; background: transparent; color: var(--theme--danger); cursor: pointer; white-space: nowrap;\n}\n.text-button[data-v-b47ff273]:disabled { opacity: .5; cursor: not-allowed;\n}\n.error-message[data-v-b47ff273] { margin: 0; color: var(--theme--danger); font-size: 12px;\n}\n@media (max-width: 700px) {\n.preview-card[data-v-b47ff273] { grid-template-columns: 1fr;\n}\n.preview-stage[data-v-b47ff273] { width: 100%; height: 180px;\n}\n}\n";
n(css,{});

var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const _sfc_main = {
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
		const previewUrl = computed(() => resolvePreviewUrl(props.value));

		watch(
			() => props.value,
			(value) => {
				previewFailed.value = false;
				loadFile(value);
			},
			{ immediate: true },
		);

		return {
			fileName,
			fileInfo,
			previewUrl,
			previewFailed,
			uploading,
			errorMessage,
			uploadFile,
			clearFile,
			onPreviewError,
		};

		function webOrigin() {
			if (typeof window === 'undefined') return 'http://localhost:3000';
			const { protocol, hostname } = window.location;
			return `${protocol}//${hostname}:3000`;
		}

		function isPublicPath(value) {
			return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
		}

		function resolvePreviewUrl(value) {
			if (!value) return '';
			if (/^https?:\/\//i.test(value)) return value;
			if (isPublicPath(value)) return `${webOrigin()}${value}`;
			return `/assets/${encodeURIComponent(value)}?width=960&fit=inside&quality=85`;
		}

		function onPreviewError() {
			previewFailed.value = true;
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
			if (isPublicPath(value)) {
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

const _hoisted_1 = { class: "media-editor" };
const _hoisted_2 = {
  key: 0,
  class: "preview-card"
};
const _hoisted_3 = { class: "preview-stage" };
const _hoisted_4 = ["src", "alt", "referrerpolicy"];
const _hoisted_5 = {
  key: 1,
  class: "preview-loading"
};
const _hoisted_5b = {
  key: 2,
  class: "preview-loading"
};
const _hoisted_6 = { class: "file-meta" };
const _hoisted_7 = { key: 0 };
const _hoisted_8 = ["disabled"];
const _hoisted_9 = {
  key: 1,
  class: "empty-state"
};
const _hoisted_10 = ["disabled"];
const _hoisted_11 = {
  key: 2,
  class: "error-message"
};

function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createElementBlock("div", _hoisted_1, [
    ($props.value)
      ? (openBlock(), createElementBlock("div", _hoisted_2, [
          createElementVNode("div", _hoisted_3, [
            ($setup.previewUrl && !$setup.previewFailed)
              ? (openBlock(), createElementBlock("img", {
                  key: 0,
                  src: $setup.previewUrl,
                  alt: $setup.fileName || '产品图片',
                  referrerpolicy: "no-referrer",
                  onError: _cache[3] || (_cache[3] = (...args) => ($setup.onPreviewError && $setup.onPreviewError(...args)))
                }, null, 40 /* PROPS, NEED_HYDRATION */, _hoisted_4))
              : ($setup.previewFailed)
                ? (openBlock(), createElementBlock("div", _hoisted_5b, "无法加载预览，请检查图片地址"))
                : (openBlock(), createElementBlock("div", _hoisted_5, "正在加载预览…"))
          ]),
          createElementVNode("div", _hoisted_6, [
            createElementVNode("strong", null, toDisplayString($setup.fileName || '已上传图片'), 1 /* TEXT */),
            ($setup.fileInfo)
              ? (openBlock(), createElementBlock("span", _hoisted_7, toDisplayString($setup.fileInfo), 1 /* TEXT */))
              : createCommentVNode("v-if", true)
          ]),
          createElementVNode("button", {
            type: "button",
            class: "text-button",
            disabled: $props.disabled,
            onClick: _cache[0] || (_cache[0] = (...args) => ($setup.clearFile && $setup.clearFile(...args)))
          }, "清除图片", 8 /* PROPS */, _hoisted_8)
        ]))
      : (openBlock(), createElementBlock("div", _hoisted_9, [...(_cache[2] || (_cache[2] = [
          createElementVNode("div", { class: "empty-icon" }, "图片", -1 /* CACHED */),
          createElementVNode("div", null, [
            createElementVNode("strong", null, "还没有图片"),
            createElementVNode("span", null, "上传后会在这里显示大图预览")
          ], -1 /* CACHED */)
        ]))])),
    createElementVNode("label", {
      class: normalizeClass(["upload-button", { disabled: $props.disabled }])
    }, [
      createElementVNode("span", null, toDisplayString($props.value ? '替换图片' : '上传图片'), 1 /* TEXT */),
      createElementVNode("input", {
        type: "file",
        accept: "image/*",
        disabled: $props.disabled || $setup.uploading,
        onChange: _cache[1] || (_cache[1] = (...args) => ($setup.uploadFile && $setup.uploadFile(...args)))
      }, null, 40 /* PROPS, NEED_HYDRATION */, _hoisted_10)
    ], 2 /* CLASS */),
    ($setup.errorMessage)
      ? (openBlock(), createElementBlock("p", _hoisted_11, toDisplayString($setup.errorMessage), 1 /* TEXT */))
      : createCommentVNode("v-if", true)
  ]))
}
var InterfaceComponent = /*#__PURE__*/_export_sfc(_sfc_main, [['render',_sfc_render],['__scopeId',"data-v-b47ff273"]]);

var index = {
	id: 'product-media-editor',
	name: '产品图片上传与预览',
	icon: 'photo_library',
	description: '用于产品、分类等图片的上传、预览、替换和清除。',
	component: InterfaceComponent,
	options: null,
	types: ['string'],
};

export { index as default };
