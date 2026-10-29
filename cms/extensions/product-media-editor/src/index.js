import InterfaceComponent from './interface.vue';
import DisplayComponent from './display.vue';

export const interfaces = [
	{
		id: 'product-media-editor',
		name: '产品图片上传与预览',
		icon: 'photo_library',
		description: '用于产品、分类等图片的上传、从媒体库选择、预览、替换和清除。',
		component: InterfaceComponent,
		options: null,
		types: ['string'],
	},
];

export const displays = [
	{
		id: 'product-media-thumbnail',
		name: '图片缩略图',
		icon: 'image',
		description: '列表中显示图片缩略图，兼容站点路径、外链和文件 ID。',
		component: DisplayComponent,
		options: null,
		types: ['string', 'uuid'],
	},
];
