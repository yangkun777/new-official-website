(function () {
	if (window.__EXCEL_TOOLBAR_INITIALIZED__) return;
	window.__EXCEL_TOOLBAR_INITIALIZED__ = true;

	var style = document.createElement('style');
	style.id = 'excel-toolbar-styles';
	style.textContent = [
		'#excel-toolbar-actions{display:inline-flex;align-items:center;gap:8px;margin-right:12px;vertical-align:middle}',
		'.excel-btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;font-size:13px;font-weight:500;border-radius:var(--theme--border-radius,6px);cursor:pointer;border:1px solid var(--theme--border-color-subdued,#d3dae4);background:var(--theme--background,#fff);color:var(--theme--foreground,#172940);user-select:none}',
		'.excel-btn:hover{border-color:var(--theme--primary,#6644ff);color:var(--theme--primary,#6644ff)}',
		'.excel-btn:disabled{opacity:.6;cursor:not-allowed}',
		'.excel-btn.primary{background:var(--theme--primary,#6644ff);color:#fff;border-color:var(--theme--primary,#6644ff)}',
		'.excel-btn svg{width:16px;height:16px;fill:currentColor}',
		'#excel-import-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px}',
		'.excel-modal-card{background:var(--theme--background,#fff);color:var(--theme--foreground,#172940);border-radius:8px;width:100%;max-width:560px;overflow:hidden;border:1px solid var(--theme--border-color-subdued,#e2e8f0)}',
		'.excel-modal-header{padding:16px 20px;font-size:16px;font-weight:600;border-bottom:1px solid var(--theme--border-color-subdued,#edf2f7);display:flex;justify-content:space-between;align-items:center}',
		'.excel-modal-body{padding:18px 20px;display:flex;flex-direction:column;gap:16px}',
		'.excel-modal-step-title{font-size:13px;font-weight:600}',
		'.excel-modal-step-desc{font-size:12px;color:var(--theme--foreground-subdued,#64748b);margin-top:4px}',
		'.excel-dropzone{border:2px dashed var(--theme--border-color-subdued,#cbd5e1);border-radius:6px;padding:22px;text-align:center;cursor:pointer;background:var(--theme--background-subdued,#f8fafc)}',
		'.excel-dropzone.has-file{border-color:var(--theme--primary,#6644ff)}',
		'.excel-rules{padding:12px 14px;background:var(--theme--background-subdued,#f8fafc);border-radius:6px;font-size:12px;line-height:1.6;color:var(--theme--foreground-subdued,#64748b)}',
		'.excel-modal-footer{padding:12px 20px;border-top:1px solid var(--theme--border-color-subdued,#edf2f7);display:flex;justify-content:flex-end;gap:10px}',
	].join('');
	document.head.appendChild(style);

	// 仅产品管理相关列表启用 Excel 导入/导出（演示范围）
	var EXCEL_COLLECTIONS = ['product', 'category', 'series'];

	function isExcelCollection(collection) {
		return EXCEL_COLLECTIONS.indexOf(collection) !== -1;
	}

	function syncNativeImportExportSidebar(collection) {
		document.querySelectorAll('aside.sidebar .accordion-item, #sidebar .accordion-item').forEach(function (item) {
			var heading = item.querySelector(':scope > h3');
			if (!heading) return;
			var label = (heading.textContent || '').replace(/\s+/g, '');
			if (label !== '导入/导出') return;
			item.style.display = isExcelCollection(collection) ? 'none' : '';
		});
	}

	function getCurrentCollection() {
		var match = window.location.pathname.match(/\/admin\/content\/([^\/\?#]+)/);
		return match ? match[1] : null;
	}

	function getCollectionLabel(col) {
		return ({ product: '产品', category: '产品分类', series: '产品系列', news: '新闻', media: '媒体' }[col] || col);
	}

	function apiFetch(url, options) {
		options = options || {};
		var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
		return fetch(url, Object.assign({}, options, { headers: headers, credentials: 'same-origin' }));
	}

	function checkAndInjectButtons() {
		var collection = getCurrentCollection();
		var existingBar = document.getElementById('excel-toolbar-actions');

		syncNativeImportExportSidebar(collection);

		if (!collection || !isExcelCollection(collection)) {
			if (existingBar) existingBar.remove();
			return;
		}

		if (existingBar && existingBar.dataset.collection === collection && document.body.contains(existingBar)) {
			return;
		}
		if (existingBar) existingBar.remove();

		var actionsContainer =
			document.querySelector('.header-bar .actions') ||
			document.querySelector('header.header-bar') ||
			document.querySelector('.content-header') ||
			document.querySelector('.layout-tabular');
		if (!actionsContainer) return;

		var container = document.createElement('div');
		container.id = 'excel-toolbar-actions';
		container.dataset.collection = collection;

		var importBtn = document.createElement('button');
		importBtn.type = 'button';
		importBtn.className = 'excel-btn';
		importBtn.innerHTML = '<span>导入</span>';
		importBtn.title = '批量导入 Excel';
		importBtn.onclick = function () {
			openImportDialog(collection);
		};

		var exportBtn = document.createElement('button');
		exportBtn.type = 'button';
		exportBtn.className = 'excel-btn primary';
		exportBtn.innerHTML = '<span>导出</span>';
		exportBtn.title = '导出当前列表为 Excel (.xlsx)';
		exportBtn.onclick = function () {
			handleExport(collection, exportBtn);
		};

		container.appendChild(importBtn);
		container.appendChild(exportBtn);

		if (actionsContainer.classList.contains('layout-tabular')) {
			actionsContainer.parentNode.insertBefore(container, actionsContainer);
			container.style.margin = '0 0 12px 0';
		} else if (actionsContainer.firstChild) {
			actionsContainer.insertBefore(container, actionsContainer.firstChild);
		} else {
			actionsContainer.appendChild(container);
		}
	}

	function handleExport(collection, btn) {
		if (!window.XLSX) {
			alert('Excel 引擎正在加载中，请稍后再试');
			return;
		}
		var originalText = btn.innerHTML;
		btn.disabled = true;
		btn.innerHTML = '<span>导出中...</span>';

		var searchInput =
			document.querySelector('input[type="search"]') ||
			document.querySelector('.header-bar input[type="text"]');
		var searchValue = searchInput ? searchInput.value.trim() : '';
		var url = '/items/' + encodeURIComponent(collection) + '?limit=-1';
		if (searchValue) url += '&search=' + encodeURIComponent(searchValue);

		apiFetch(url)
			.then(function (res) {
				if (!res.ok) throw new Error('接口返回异常: ' + res.status);
				return res.json();
			})
			.then(function (json) {
				var items = json.data || [];
				if (!items.length) {
					alert('当前筛选或搜索条件下没有找到任何数据。');
					return;
				}
				var ws = window.XLSX.utils.json_to_sheet(items);
				var wb = window.XLSX.utils.book_new();
				window.XLSX.utils.book_append_sheet(wb, ws, '数据');
				window.XLSX.writeFile(wb, getCollectionLabel(collection) + '_导出_' + new Date().toISOString().slice(0, 10) + '.xlsx');
			})
			.catch(function (err) {
				alert('导出失败: ' + err.message);
			})
			.finally(function () {
				btn.disabled = false;
				btn.innerHTML = originalText;
			});
	}

	function openImportDialog(collection) {
		var overlay = document.getElementById('excel-import-modal-overlay');
		if (overlay) overlay.remove();
		var currentFile = null;
		overlay = document.createElement('div');
		overlay.id = 'excel-import-modal-overlay';
		overlay.innerHTML =
			'<div class="excel-modal-card">' +
			'<div class="excel-modal-header"><span>批量导入（' + getCollectionLabel(collection) + '）</span>' +
			'<button type="button" class="excel-modal-close" style="background:none;border:none;cursor:pointer;font-size:18px;">&times;</button></div>' +
			'<div class="excel-modal-body">' +
			'<div><div class="excel-modal-step-title">1. 下载模板</div>' +
			'<div class="excel-modal-step-desc">先下载标准 Excel 模板，按表头整理后再上传。</div>' +
			'<button type="button" id="excel-download-tpl-btn" class="excel-btn" style="margin-top:8px">下载标准 Excel 模板 (.xlsx)</button></div>' +
			'<div><div class="excel-modal-step-title">2. 上传文件</div>' +
			'<div class="excel-dropzone" id="excel-modal-dropzone">' +
			'<div id="excel-dropzone-prompt"><strong>点击选择或拖拽 Excel 到此处</strong><br><span style="font-size:11px;color:#94a3b8">支持 .xlsx / .xls / .csv</span></div>' +
			'<input type="file" id="excel-modal-file-input" accept=".xlsx,.xls,.csv" style="display:none" /></div></div>' +
			'<div class="excel-rules">含 <strong>id</strong> 的行会更新已有记录；无 id 则新增。空白单元格不会覆盖原值。</div>' +
			'</div>' +
			'<div class="excel-modal-footer">' +
			'<button type="button" class="excel-btn" id="excel-modal-cancel">取消</button>' +
			'<button type="button" class="excel-btn primary" id="excel-modal-submit" disabled>开始导入</button>' +
			'</div></div>';
		document.body.appendChild(overlay);

		function closeModal() {
			overlay.remove();
		}
		overlay.querySelector('.excel-modal-close').onclick = closeModal;
		overlay.querySelector('#excel-modal-cancel').onclick = closeModal;
		overlay.onclick = function (e) {
			if (e.target === overlay) closeModal();
		};

		overlay.querySelector('#excel-download-tpl-btn').onclick = function () {
			apiFetch('/fields/' + encodeURIComponent(collection))
				.then(function (res) {
					return res.json();
				})
				.then(function (json) {
					var fields = json.data || [];
					var headers = fields
						.filter(function (f) {
							return !f.meta || !f.meta.hidden;
						})
						.map(function (f) {
							return f.field;
						})
						.filter(function (f) {
							return f && f.indexOf('$') !== 0;
						});
					if (!headers.length) headers = ['id'];
					var row = {};
					headers.forEach(function (h) {
						row[h] = h === 'id' ? '留空新增/填写修改' : '';
					});
					var ws = window.XLSX.utils.json_to_sheet([row]);
					var wb = window.XLSX.utils.book_new();
					window.XLSX.utils.book_append_sheet(wb, ws, '导入模板');
					window.XLSX.writeFile(wb, getCollectionLabel(collection) + '_导入模板.xlsx');
				})
				.catch(function (err) {
					alert('下载模板失败: ' + err.message);
				});
		};

		var dropzone = overlay.querySelector('#excel-modal-dropzone');
		var fileInput = overlay.querySelector('#excel-modal-file-input');
		var submitBtn = overlay.querySelector('#excel-modal-submit');
		var promptDiv = overlay.querySelector('#excel-dropzone-prompt');
		dropzone.onclick = function () {
			fileInput.click();
		};
		fileInput.onchange = function (e) {
			if (e.target.files && e.target.files[0]) {
				currentFile = e.target.files[0];
				dropzone.classList.add('has-file');
				promptDiv.innerHTML = '<strong>' + currentFile.name + '</strong>';
				submitBtn.disabled = false;
			}
		};

		submitBtn.onclick = function () {
			if (!currentFile || !window.XLSX) return;
			submitBtn.disabled = true;
			submitBtn.innerText = '正在导入...';
			var reader = new FileReader();
			reader.onload = function (e) {
				try {
					var wb = window.XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
					var rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
					if (!rows.length) throw new Error('表格中未找到数据行');
					var successCount = 0;
					var failCount = 0;
					var chain = Promise.resolve();
					rows.forEach(function (row) {
						chain = chain.then(function () {
							var payload = {};
							Object.keys(row).forEach(function (k) {
								var v = row[k];
								if (v === '__CLEAR__') payload[k] = null;
								else if (v !== '' && v != null) payload[k] = v;
							});
							var id = payload.id;
							delete payload.id;
							var req =
								id && !isNaN(Number(id))
									? apiFetch('/items/' + encodeURIComponent(collection) + '/' + id, {
											method: 'PATCH',
											body: JSON.stringify(payload),
									  })
									: apiFetch('/items/' + encodeURIComponent(collection), {
											method: 'POST',
											body: JSON.stringify(payload),
									  });
							return req.then(function (res) {
								if (res.ok) successCount++;
								else failCount++;
							});
						});
					});
					chain.then(function () {
						closeModal();
						alert('导入完成。成功 ' + successCount + ' 条，失败 ' + failCount + ' 条。');
						window.location.reload();
					});
				} catch (err) {
					alert('Excel 解析失败: ' + err.message);
					submitBtn.disabled = false;
					submitBtn.innerText = '开始导入';
				}
			};
			reader.readAsArrayBuffer(currentFile);
		};
	}

	setInterval(checkAndInjectButtons, 500);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', checkAndInjectButtons);
	} else {
		checkAndInjectButtons();
	}
})();
