import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

# --- Configuration for IEEE Style Plots ---
# Setting a professional style
sns.set_theme(style="whitegrid")
plt.rcParams.update({
    'font.family': 'serif',          # IEEE uses serif fonts (Times New Roman equivalent)
    'font.size': 12,
    'axes.labelsize': 12,
    'axes.titlesize': 14,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'figure.dpi': 300,               # High resolution for print
    'savefig.dpi': 300
})

# ==========================================
# FIGURE 1: Comparative Accuracy (Bar Chart)
# ==========================================
def plot_accuracy():
    # Data
    modules = ['Face Recog.', 'Face Detect.', 'Gaze Tracking', 'Object Detect.', 'Emotion Analysis']
    accuracy = [99.2, 98.4, 94.0, 92.1, 85.6]
    
    # Create DataFrame
    df_acc = pd.DataFrame({'Module': modules, 'Accuracy (%)': accuracy})
    
    # Plot
    plt.figure(figsize=(8, 5))
    ax = sns.barplot(x='Module', y='Accuracy (%)', data=df_acc, palette='viridis', edgecolor='black')
    
    # Formatting
    plt.ylim(80, 100)  # Start y-axis at 80 to show differences clearly
    plt.title('Fig. 1. Comparative Accuracy of AI Modules', fontweight='bold', pad=15)
    plt.ylabel('Accuracy (%)')
    plt.xlabel('')
    
    # Add numbers on top of bars
    for i in ax.containers:
        ax.bar_label(i, fmt='%.1f%%', padding=3)
        
    plt.tight_layout()
    plt.savefig('fig1_accuracy.png')
    plt.show()
    print("Generated Fig. 1: Accuracy Chart")

# ==========================================
# FIGURE 2: Latency Breakdown (Horizontal Bar / Stacked-like)
# ==========================================
def plot_latency():
    # Data
    components = ['Deep Learning Inference', 'Database Logging', 'Frame Capture/Misc', 
                  'Server Communication', 'Dashboard Rendering', 'Logic Processing']
    times_ms = [35, 30, 30, 10, 10, 5]
    
    # Create DataFrame and sort for better visualization
    df_lat = pd.DataFrame({'Component': components, 'Time (ms)': times_ms})
    df_lat = df_lat.sort_values('Time (ms)', ascending=True)
    
    # Plot
    plt.figure(figsize=(8, 5))
    ax = sns.barplot(x='Time (ms)', y='Component', data=df_lat, palette='Blues_d', edgecolor='black')
    
    # Formatting
    plt.title('Fig. 2. End-to-End System Latency Breakdown', fontweight='bold', pad=15)
    plt.xlabel('Time (milliseconds)')
    plt.ylabel('')
    
    # Add numbers to the end of bars
    for i in ax.containers:
        ax.bar_label(i, fmt='%d ms', padding=3)
        
    plt.tight_layout()
    plt.savefig('fig2_latency.png')
    plt.show()
    print("Generated Fig. 2: Latency Chart")

# ==========================================
# FIGURE 3: Emotion Distribution (Donut Chart)
# ==========================================
def plot_emotions():
    # Data
    labels = ['Neutral (Focused)', 'Happy (Engaged)', 'Stressed', 'Fatigued', 'Angry', 'Surprised']
    sizes = [45, 20, 15, 10, 5, 5]
    
    # Colors suitable for professional papers (using a seaborn palette)
    colors = sns.color_palette('pastel')[0:6]
    
    # Plot
    plt.figure(figsize=(7, 7))
    
    # Create a pie chart
    wedges, texts, autotexts = plt.pie(sizes, labels=labels, autopct='%1.1f%%', 
                                       startangle=140, colors=colors, pctdistance=0.85,
                                       wedgeprops={'edgecolor': 'black'})
    
    # Draw a white circle at the center to make it a Donut Chart (looks more modern)
    centre_circle = plt.Circle((0,0), 0.70, fc='white')
    fig = plt.gcf()
    fig.gca().add_artist(centre_circle)
    
    # Formatting text
    plt.setp(autotexts, size=10, weight="bold", color="black")
    plt.title('Fig. 3. Distribution of Detected Emotional States', fontweight='bold', pad=15)
    
    plt.tight_layout()
    plt.savefig('fig3_emotions.png')
    plt.show()
    print("Generated Fig. 3: Emotion Distribution Chart")

# Run all functions
plot_accuracy()
plot_latency()
plot_emotions()