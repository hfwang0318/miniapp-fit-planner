const weightService = require('../../services/weight');
const { validate } = require('../../models/weight');
const { formatWeight } = require('../../utils/weight');
const { today } = require('../../utils/date');
const { UNITS, PAGINATION } = require('../../config/constants');

Page({
  data: {
    records: [],
    loading: true,
    hasMore: true,
    showForm: false,
    editingId: null,
    submitting: false,
    form: {
      weight: '',
      unit: 'kg',
      recordedAt: '',
      note: ''
    },
    // Stats
    recordCount: 0,
    latestWeight: null
  },

  onLoad() {
    const todayStr = today();
    this.setData({
      maxDate: todayStr,
      'form.recordedAt': todayStr
    });
    this.loadRecords();
  },

  onShow() {
    // Refresh when coming back from other pages
    if (!this.data.loading) {
      this.loadRecords(true);
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecords();
    }
  },

  /**
   * Load weight records.
   * @param {boolean} [reset=false] - Reset the records list before loading
   */
  loadRecords(reset) {
    const offset = reset ? null : (this.data.records.length > 0 ? this.data.records[this.data.records.length - 1].recordId : null);

    this.setData({ loading: true });

    const params = { limit: PAGINATION.PAGE_SIZE };
    if (offset && !reset) {
      params.offset = offset;
    }

    weightService.getWeights(params).then(result => {
      if (result.success) {
        const newRecords = result.data.records || [];
        const records = reset ? newRecords : this.data.records.concat(newRecords);
        const stats = weightService.getStats(records);
        const trend = stats.trend ? stats.trend.direction : 'stable';

        // Pre-format weight display values for WXML
        const recordsFormatted = records.map(r => ({
          ...r,
          _formattedWeight: formatWeight(r.weight, r.unit)
        }));
        const latestFormatted = stats.latest
          ? formatWeight(stats.latest.weight, stats.latest.unit)
          : '--';

        this.setData({
          records: recordsFormatted,
          hasMore: result.data.hasMore !== false,
          loading: false,
          recordCount: stats.count,
          latestWeight: stats.latest,
          latestFormatted,
          trend
        });
      } else {
        wx.showToast({
          title: result.error && result.error.message || '加载失败，请重试',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    }).catch(() => {
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    });
  },

  onToggleForm() {
    if (this.data.showForm) {
      this.setData({ showForm: false, editingId: null });
    } else {
      this.setData({
        showForm: true,
        editingId: null,
        form: {
          weight: '',
          unit: 'kg',
          recordedAt: today(),
          note: ''
        }
      });
    }
  },

  onEditTap(e) {
    const recordId = e.currentTarget.dataset.recordid;
    const record = this.data.records.find(r => r.recordId === recordId);
    if (!record) return;

    this.setData({
      showForm: true,
      editingId: recordId,
      form: {
        weight: String(record.weight),
        unit: record.unit || 'kg',
        recordedAt: record.recordedAt,
        note: record.note || ''
      }
    });
  },

  onDeleteTap(e) {
    const recordId = e.currentTarget.dataset.recordid;
    const record = this.data.records.find(r => r.recordId === recordId);
    if (!record) return;

    const that = this;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除 ${formatWeight(record.weight, record.unit)} 的记录吗？`,
      success(res) {
        if (res.confirm) {
          that.deleteRecord(recordId);
        }
      }
    });
  },

  deleteRecord(recordId) {
    weightService.deleteWeight(recordId).then(result => {
      if (result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        this.loadRecords(true);
      } else {
        wx.showToast({
          title: result.error && result.error.message || '删除失败，请重试',
          icon: 'none'
        });
      }
    }).catch(() => {
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    });
  },

  /** Handle weight input */
  onWeightInput(e) {
    this.setData({ 'form.weight': e.detail.value });
  },

  /** Handle unit change */
  onUnitChange(e) {
    const units = [UNITS.KG, UNITS.LB];
    this.setData({ 'form.unit': units[e.detail.value] || 'kg' });
  },

  /** Handle date change */
  onDateChange(e) {
    this.setData({ 'form.recordedAt': e.detail.value });
  },

  /** Handle note input */
  onNoteInput(e) {
    var value = e.detail.value;
    if (value.length > 200) {
      value = value.substring(0, 200);
    }
    this.setData({ 'form.note': value });
  },

  onSubmit() {
    if (this.data.submitting) return;

    const form = this.data.form;
    const weight = parseFloat(form.weight);

    // Build record for validation
    const record = {
      weight: isNaN(weight) ? form.weight : weight,
      unit: form.unit,
      recordedAt: form.recordedAt,
      note: form.note
    };

    const validation = validate(record);
    if (!validation.valid) {
      wx.showToast({
        title: validation.errors[0],
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({ submitting: true });

    const submitData = {
      weight,
      unit: form.unit,
      recordedAt: form.recordedAt,
      note: form.note || ''
    };

    let promise;
    if (this.data.editingId) {
      promise = weightService.updateWeight({
        recordId: this.data.editingId,
        ...submitData
      });
    } else {
      promise = weightService.createWeight(submitData);
    }

    promise.then(result => {
      this.setData({ submitting: false });

      if (result.success) {
        wx.showToast({
          title: this.data.editingId ? '更新成功' : '保存成功',
          icon: 'success'
        });
        this.setData({ showForm: false, editingId: null });
        this.loadRecords(true);
      } else {
        wx.showToast({
          title: result.error && result.error.message || '操作失败，请重试',
          icon: 'none'
        });
      }
    }).catch(() => {
      this.setData({ submitting: false });
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    });
  }
});
