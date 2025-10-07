/**
 * Chart Component for Admin Dashboard
 * Simple canvas-based chart for visualizing entries per category
 */
class CategoryChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.colors = options.colors || [
            '#0B5FFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
        ];
        this.padding = options.padding || 40;
        this.barWidth = options.barWidth || 40;
        this.animationDuration = options.animationDuration || 1000;
        this.animatedValues = [];
        
        this.setupCanvas();
    }

    setupCanvas() {
        // Set canvas size for high DPI displays
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
    }

    setData(data) {
        this.data = data;
        this.animatedValues = new Array(data.length).fill(0);
        this.animate();
    }

    animate() {
        const startTime = performance.now();
        
        const animationFrame = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            
            // Easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Update animated values
            this.data.forEach((item, index) => {
                this.animatedValues[index] = item.count * easeProgress;
            });
            
            this.draw();
            
            if (progress < 1) {
                requestAnimationFrame(animationFrame);
            }
        };
        
        requestAnimationFrame(animationFrame);
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.data.length === 0) {
            this.drawEmptyState();
            return;
        }
        
        // Calculate dimensions
        const chartWidth = this.width - (this.padding * 2);
        const chartHeight = this.height - (this.padding * 2);
        const maxCount = Math.max(...this.data.map(item => item.count));
        const barSpacing = chartWidth / this.data.length;
        
        // Draw axes
        this.drawAxes(chartHeight);
        
        // Draw bars
        this.data.forEach((item, index) => {
            const barHeight = (this.animatedValues[index] / maxCount) * chartHeight;
            const x = this.padding + (index * barSpacing) + (barSpacing - this.barWidth) / 2;
            const y = this.height - this.padding - barHeight;
            
            // Draw bar
            this.ctx.fillStyle = this.colors[index % this.colors.length];
            this.ctx.fillRect(x, y, this.barWidth, barHeight);
            
            // Draw value on top of bar
            if (this.animatedValues[index] > 0) {
                this.ctx.fillStyle = '#1E293B';
                this.ctx.font = '12px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    Math.round(this.animatedValues[index]),
                    x + this.barWidth / 2,
                    y - 5
                );
            }
            
            // Draw category label
            this.ctx.save();
            this.ctx.translate(x + this.barWidth / 2, this.height - this.padding + 15);
            this.ctx.rotate(-Math.PI / 6);
            this.ctx.fillStyle = '#64748B';
            this.ctx.font = '11px sans-serif';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(this.truncateText(item.name, 15), 0, 0);
            this.ctx.restore();
        });
        
        // Draw title
        this.drawTitle();
    }

    drawAxes(chartHeight) {
        this.ctx.strokeStyle = '#E2E8F0';
        this.ctx.lineWidth = 1;
        
        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, this.padding);
        this.ctx.lineTo(this.padding, this.height - this.padding);
        this.ctx.stroke();
        
        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, this.height - this.padding);
        this.ctx.lineTo(this.width - this.padding, this.height - this.padding);
        this.ctx.stroke();
        
        // Y-axis labels
        const maxCount = Math.max(...this.data.map(item => item.count));
        const steps = 5;
        
        this.ctx.fillStyle = '#64748B';
        this.ctx.font = '11px sans-serif';
        this.ctx.textAlign = 'right';
        
        for (let i = 0; i <= steps; i++) {
            const value = Math.round((maxCount / steps) * i);
            const y = this.height - this.padding - (chartHeight / steps) * i;
            
            this.ctx.fillText(value, this.padding - 10, y + 4);
            
            // Grid lines
            if (i > 0) {
                this.ctx.strokeStyle = '#F1F5F9';
                this.ctx.beginPath();
                this.ctx.moveTo(this.padding, y);
                this.ctx.lineTo(this.width - this.padding, y);
                this.ctx.stroke();
            }
        }
    }

    drawTitle() {
        this.ctx.fillStyle = '#1E293B';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Websites per Category', this.width / 2, 20);
    }

    drawEmptyState() {
        this.ctx.fillStyle = '#64748B';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('No data available', this.width / 2, this.height / 2);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    // Method to handle window resize
    resize() {
        this.setupCanvas();
        this.draw();
    }

    // Method to update colors
    setColors(colors) {
        this.colors = colors;
        this.draw();
    }

    // Method to destroy the chart
    destroy() {
        // Clean up any resources if needed
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}

// Simple Pie Chart Alternative
class PieChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.colors = options.colors || [
            '#0B5FFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
        ];
        this.animationDuration = options.animationDuration || 1000;
        this.currentAngles = [];
        
        this.setupCanvas();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.radius = Math.min(this.width, this.height) / 2 - 40;
    }

    setData(data) {
        this.data = data;
        this.currentAngles = new Array(data.length).fill(0);
        this.animate();
    }

    animate() {
        const startTime = performance.now();
        const total = this.data.reduce((sum, item) => sum + item.count, 0);
        const targetAngles = this.data.map(item => (item.count / total) * Math.PI * 2);
        
        const animationFrame = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            
            // Easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Update angles
            targetAngles.forEach((targetAngle, index) => {
                this.currentAngles[index] = targetAngle * easeProgress;
            });
            
            this.draw();
            
            if (progress < 1) {
                requestAnimationFrame(animationFrame);
            }
        };
        
        requestAnimationFrame(animationFrame);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.data.length === 0) {
            this.drawEmptyState();
            return;
        }
        
        let currentAngle = -Math.PI / 2; // Start from top
        
        this.data.forEach((item, index) => {
            const sliceAngle = this.currentAngles[index];
            
            // Draw slice
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.radius, currentAngle, currentAngle + sliceAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = this.colors[index % this.colors.length];
            this.ctx.fill();
            
            // Draw label
            if (sliceAngle > 0.1) { // Only show label for visible slices
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = this.centerX + Math.cos(labelAngle) * (this.radius * 0.7);
                const labelY = this.centerY + Math.sin(labelAngle) * (this.radius * 0.7);
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 12px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(item.count, labelX, labelY);
            }
            
            currentAngle += sliceAngle;
        });
        
        // Draw legend
        this.drawLegend();
    }

    drawLegend() {
        const legendX = 20;
        let legendY = 20;
        
        this.data.forEach((item, index) => {
            // Color box
            this.ctx.fillStyle = this.colors[index % this.colors.length];
            this.ctx.fillRect(legendX, legendY, 12, 12);
            
            // Label
            this.ctx.fillStyle = '#1E293B';
            this.ctx.font = '11px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${item.name} (${item.count})`, legendX + 18, legendY + 6);
            
            legendY += 18;
        });
    }

    drawEmptyState() {
        this.ctx.fillStyle = '#64748B';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('No data available', this.width / 2, this.height / 2);
    }

    resize() {
        this.setupCanvas();
        this.draw();
    }

    destroy() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CategoryChart, PieChart };
}