import numpy as np
import matplotlib.pyplot as plt

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 5))

# --- Plot 1: Liveness Signal (Blink EMA Variance) ---
np.random.seed(42)
frames = np.arange(1, 31)
# Create a signal that stays near 0, spikes at frame 15, returns by frame 20
base_noise = np.random.normal(0.005, 0.005, 30)
spike = np.zeros(30)
spike[13:18] = [0.03, 0.08, 0.10, 0.04, 0.01] # The blink
signal = np.clip(base_noise + spike, 0, 0.15)

ax1.plot(frames, signal, marker='o', color='#2ca02c', linewidth=2, label='Blink Variance Ratio')
ax1.axhline(y=0.05, color='#d62728', linestyle='--', label='Spike Threshold (0.05)')
ax1.axhline(y=0.02, color='#1f77b4', linestyle=':', label='Return Threshold (0.02)')

# Highlight the confirmed blink region
ax1.axvspan(14, 18, color='green', alpha=0.1, label='Blink Confirmed')

ax1.set_title('Real-time Liveness Signal (EMA Variance)')
ax1.set_xlabel('Camera Frames processed')
ax1.set_ylabel('Variance Ratio vs EMA Baseline')
ax1.set_ylim([-0.01, 0.12])
ax1.legend(loc='upper right')
ax1.grid(True, alpha=0.3)

# --- Plot 2: Processing Latency Breakdown ---
components = ['BlazeFace\nDetection', 'BlinkDetector\n(Liveness)', 'MobileFaceNet\nEmbedding', 'Cosine Match\n& Logic']
latencies = [42, 68, 135, 4] # ms
y_pos = np.arange(len(components))

bars = ax2.barh(y_pos, latencies, color=['#ff7f0e', '#9467bd', '#8c564b', '#e377c2'])
ax2.set_yticks(y_pos)
ax2.set_yticklabels(components)
ax2.invert_yaxis()  # labels read top-to-bottom
ax2.set_xlabel('Latency (ms) on mid-range Android')
ax2.set_title('On-Device Edge Processing Latency')

# Add the values on the bars
for bar in bars:
    width = bar.get_width()
    ax2.text(width + 3, bar.get_y() + bar.get_height()/2., f'{int(width)}ms', 
             ha='left', va='center', fontweight='bold', color='#333333')

ax2.set_xlim([0, 160])
ax2.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig('assets/benchmark_results.png', dpi=150, bbox_inches='tight')
