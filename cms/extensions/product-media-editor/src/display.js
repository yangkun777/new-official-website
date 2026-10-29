import DisplayComponent from './display.vue';

export default {
	id: 'product-media-thumbnail',
	name: '图片缩略图',
	icon: 'image',
	description: '列表中显示图片缩略图，兼容站点路径、外链和文件 ID。',
	component: DisplayComponent,
	options: null,
	types: ['string', 'uuid'],
};
