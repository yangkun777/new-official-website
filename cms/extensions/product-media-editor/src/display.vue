<template>
	<div class="thumb" :title="value ? '' : '还没有图片'">
		<img
			v-if="url && !failed"
			:src="url"
			alt=""
			referrerpolicy="no-referrer"
			@error="failed = true"
		/>
		<span v-else class="empty">无图</span>
	</div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import { resolvePreviewUrl } from './previewUrl.js';

export default {
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const failed = ref(false);
		const url = computed(() => resolvePreviewUrl(props.value, { width: 96, height: 96, fit: 'cover' }));
		watch(
			() => props.value,
			() => {
				failed.value = false;
			},
		);
		return { url, failed };
	},
};
</script>

<style scoped>
.thumb {
	width: 48px;
	height: 48px;
	border-radius: 6px;
	overflow: hidden;
	background: #fff;
	border: 1px solid var(--theme--border-color);
	display: grid;
	place-items: center;
}
.thumb img {
	width: 100%;
	height: 100%;
	object-fit: contain;
}
.empty {
	color: var(--theme--foreground-subdued);
	font-size: 11px;
	line-height: 1;
}
</style>
