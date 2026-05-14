Component({
  properties: {
    records: {
      type: Array,
      value: [],
      observer: 'drawChart'
    },
    height: {
      type: Number,
      value: 300
    }
  },

  data: {
    canvasWidth: 0,
    canvasHeight: 0
  },

  methods: {
    drawChart() {
      const records = this.properties.records;
      if (!records || records.length === 0) return;

      // Small defer to ensure canvas is in the DOM
      setTimeout(() => {
        const query = wx.createSelectorQuery().in(this);
        query.select('#chartCanvas')
          .fields({ node: true, size: true })
          .exec(res => {
            if (!res || !res[0]) return;
            this.renderChart(res[0]);
          });
      }, 50);
    },

    renderChart({ node: canvas, width: cssWidth, height: cssHeight }) {
      const sysInfo = wx.getSystemInfoSync();
      const dpr = sysInfo.pixelRatio;
      const screenWidth = sysInfo.windowWidth;

      // Calculate rpx-to-px ratio
      const rpxToPx = screenWidth / 750;

      const ctx = canvas.getContext('2d');
      const records = this.properties.records;

      // Set canvas internal size for sharp rendering
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      // Padding in px (converted from rpx)
      const paddingLeft = 80 * rpxToPx;
      const paddingRight = 40 * rpxToPx;
      const paddingTop = 40 * rpxToPx;
      const paddingBottom = 60 * rpxToPx;

      const chartWidth = cssWidth - paddingLeft - paddingRight;
      const chartHeight = cssHeight - paddingTop - paddingBottom;

      // Sort records by date ascending for chart
      const sorted = [].concat(records).sort((a, b) => {
        return new Date(a.recordedAt) - new Date(b.recordedAt);
      });

      if (sorted.length < 2) {
        ctx.fillStyle = '#999999';
        ctx.font = `${Math.round(28 * rpxToPx)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('需要至少2条记录', cssWidth / 2, cssHeight / 2);
        return;
      }

      // Calculate Y range (min/max with 10% padding)
      const weights = sorted.map(r => r.weight);
      let minW = Math.min.apply(null, weights);
      let maxW = Math.max.apply(null, weights);
      const range = maxW - minW || 1;
      const padding = range * 0.1;
      minW = Math.max(0, minW - padding);
      maxW = maxW + padding;

      // Y-axis label count
      const yLabelCount = 5;

      // Grid line style
      ctx.strokeStyle = '#F0F0F0';
      ctx.lineWidth = 1;

      // Draw horizontal grid lines and Y labels
      const labelFontSize = Math.round(20 * rpxToPx);
      ctx.fillStyle = '#999999';
      ctx.font = `${labelFontSize}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= yLabelCount; i++) {
        const y = paddingTop + (chartHeight * i) / yLabelCount;
        const value = maxW - (maxW - minW) * (i / yLabelCount);
        const label = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);

        // Grid line
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(cssWidth - paddingRight, y);
        ctx.stroke();

        // Y label (convert rpx offset for font)
        ctx.fillText(label, paddingLeft - 16 * rpxToPx, y);
      }

      // Calculate X label frequency (show every Nth to avoid crowding)
      const maxXLabels = Math.floor(chartWidth / (120 * rpxToPx));
      const xStep = Math.max(1, Math.ceil(sorted.length / maxXLabels));

      // Draw X-axis date labels
      ctx.fillStyle = '#999999';
      ctx.font = `${labelFontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let i = 0; i < sorted.length; i++) {
        const x = paddingLeft + (chartWidth * i) / (sorted.length - 1);
        if (i % xStep === 0 || i === sorted.length - 1) {
          const dateStr = sorted[i].recordedAt;
          const shortDate = dateStr ? dateStr.substring(5) : '';
          ctx.fillText(shortDate, x, cssHeight - paddingBottom + 16 * rpxToPx);
        }
      }

      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = '#07C160';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (let i = 0; i < sorted.length; i++) {
        const x = paddingLeft + (chartWidth * i) / (sorted.length - 1);
        const y = paddingTop + chartHeight * (1 - (sorted[i].weight - minW) / (maxW - minW));

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw dots at each data point
      ctx.fillStyle = '#07C160';

      for (let i = 0; i < sorted.length; i++) {
        const x = paddingLeft + (chartWidth * i) / (sorted.length - 1);
        const y = paddingTop + chartHeight * (1 - (sorted[i].weight - minW) / (maxW - minW));

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  lifetimes: {
    attached() {
      // Defer drawing to after layout
    },
    ready() {
      this.drawChart();
    }
  }
});
