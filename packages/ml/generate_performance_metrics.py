"""
Generate individual model performance metrics visualizations
Creates separate bar charts for each ML model showing performance across metrics
"""

import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
from datetime import datetime

# Model performance data
models = ['CNN', 'SVM', 'XGBoost', 'CHRF', 'Voting Ensemble', 'Final Ensemble']
metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC']

# Performance data (values between 0 and 1)
performance_data = {
    'CNN': [0.965, 0.962, 0.970, 0.966, 0.988],
    'XGBoost': [0.968, 0.965, 0.973, 0.969, 0.991],
    'SVM': [0.960, 0.958, 0.960, 0.959, 0.989],
    'CHRF': [0.945, 0.948, 0.955, 0.951, 0.947],
    'Voting Ensemble': [0.970, 0.964, 0.975, 0.969, 0.911],
    'Final Ensemble': [0.968, 0.967, 0.973, 0.970, 0.914],
}

# Unique color for each model
model_colors = {
    'CNN': '#70AD47',
    'XGBoost': '#4472C4',
    'SVM': '#ED7D31',
    'CHRF': '#A5A5A5',
    'Voting Ensemble': '#FFC000',
    'Final Ensemble': '#5B9BD5',
}

def generate_individual_model_chart(model_name, metrics_values):
    """Generate a performance chart for a single model"""
    
    fig, ax = plt.subplots(figsize=(12, 7))
    
    # Create bars
    x = np.arange(len(metrics))
    bars = ax.bar(x, metrics_values, color=model_colors[model_name], alpha=0.85, edgecolor='black', linewidth=1.5, width=0.6)
    
    # Add value labels on top of bars
    for bar, value in zip(bars, metrics_values):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.005,
               f'{value:.3f}', ha='center', va='bottom', fontsize=13, fontweight='bold')
    
    # Customize the plot
    ax.set_ylabel('Score', fontsize=13, fontweight='bold')
    ax.set_title(f'{model_name} - Performance Metrics', fontsize=18, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=12, fontweight='bold')
    ax.set_ylim(0.90, 1.02)
    ax.set_yticks(np.arange(0.90, 1.03, 0.02))
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda y, _: f'{y:.2f}'))
    
    # Add grid
    ax.grid(axis='y', alpha=0.4, linestyle='--', linewidth=0.8)
    ax.set_axisbelow(True)
    
    # Add a subtle background
    ax.set_facecolor('#f8f9fa')
    fig.patch.set_facecolor('white')
    
    # Adjust layout
    plt.tight_layout()
    
    # Create output directory
    output_dir = Path(__file__).parent.parent.parent / 'docs' / 'performance_metrics' / 'individual_models'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save the figure with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f'{model_name.replace(" ", "_")}_{timestamp}.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
    print(f"✅ {model_name} performance chart saved")
    
    # Also save a version without timestamp
    latest_path = output_dir / f'{model_name.replace(" ", "_")}.png'
    plt.savefig(latest_path, dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
    
    plt.close()
    
    return str(latest_path)

def generate_all_individual_charts():
    """Generate individual charts for all models"""
    
    output_files = {}
    
    for model_name in models:
        metrics_values = performance_data[model_name]
        output_path = generate_individual_model_chart(model_name, metrics_values)
        output_files[model_name] = output_path
    
    return output_files

if __name__ == '__main__':
    print("🔄 Generating individual model performance metrics visualizations...\n")
    output_files = generate_all_individual_charts()
    
    print(f"\n📊 Chart generation complete!")
    print(f"📁 Output directory: docs/performance_metrics/individual_models/")
    print("\n🎯 Generated charts:")
    for model, path in output_files.items():
        print(f"   • {model}")

