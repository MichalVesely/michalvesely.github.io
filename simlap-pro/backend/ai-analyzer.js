const axios = require('axios');

class AIAnalyzer {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || null;
    this.useLocalAnalysis = !this.openaiApiKey;
  }

  async analyzeLap(telemetryData) {
    if (this.openaiApiKey && !this.useLocalAnalysis) {
      return await this.analyzeWithOpenAI(telemetryData);
    } else {
      return this.analyzeLocally(telemetryData);
    }
  }

  async analyzeWithOpenAI(telemetryData) {
    try {
      const prompt = this.buildAnalysisPrompt(telemetryData);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert sim racing coach analyzing telemetry data. Provide specific, actionable advice to help drivers improve their lap times.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        insights: response.data.choices[0].message.content,
        recommendations: this.extractRecommendations(response.data.choices[0].message.content),
        analysis_type: 'ai_powered'
      };
    } catch (error) {
      console.error('OpenAI API error, falling back to local analysis:', error.message);
      return this.analyzeLocally(telemetryData);
    }
  }

  analyzeLocally(telemetryData) {
    const insights = [];
    const recommendations = [];

    // Analyze lap time
    const lapTimeMinutes = Math.floor(telemetryData.lapTime / 60);
    const lapTimeSeconds = (telemetryData.lapTime % 60).toFixed(3);
    insights.push(`📊 Lap Time: ${lapTimeMinutes}:${lapTimeSeconds.padStart(6, '0')}`);

    // Speed analysis
    insights.push(`\n🏎️ **Speed Analysis:**`);
    insights.push(`- Maximum Speed: ${telemetryData.maxSpeed.toFixed(1)} km/h`);
    insights.push(`- Average Speed: ${telemetryData.avgSpeed.toFixed(1)} km/h`);
    insights.push(`- Minimum Speed: ${telemetryData.minSpeed.toFixed(1)} km/h`);

    if (telemetryData.avgSpeed < 150) {
      recommendations.push({
        priority: 'high',
        category: 'speed',
        title: 'Increase Average Speed',
        description: 'Your average speed is relatively low. Focus on carrying more speed through corners and getting on throttle earlier.'
      });
    }

    // Braking analysis
    if (telemetryData.brakingPoints.length > 0) {
      insights.push(`\n🛑 **Braking Analysis:**`);
      insights.push(`- Braking Zones: ${telemetryData.brakingPoints.length}`);
      insights.push(`- Max Brake Pressure: ${(telemetryData.maxBrake * 100).toFixed(1)}%`);

      if (telemetryData.maxBrake < 0.95) {
        recommendations.push({
          priority: 'medium',
          category: 'braking',
          title: 'Brake Harder Initially',
          description: 'You\'re not using maximum brake pressure. Try braking harder initially, then trail off as you approach the apex.'
        });
      }
    }

    // Throttle analysis
    insights.push(`\n⚡ **Throttle Control:**`);
    insights.push(`- Max Throttle: ${(telemetryData.maxThrottle * 100).toFixed(1)}%`);

    if (telemetryData.accelerationPoints.length < 5) {
      recommendations.push({
        priority: 'high',
        category: 'acceleration',
        title: 'Improve Acceleration Zones',
        description: 'Work on identifying optimal acceleration points. Get back to full throttle as early as possible while maintaining control.'
      });
    }

    // Corner analysis
    if (telemetryData.corners.length > 0) {
      insights.push(`\n🏁 **Corner Analysis:**`);
      insights.push(`- Corner Count: ${telemetryData.corners.length}`);

      const avgCornerSpeed = telemetryData.corners.reduce((sum, c) => sum + c.speed, 0) / telemetryData.corners.length;
      insights.push(`- Avg Corner Speed: ${avgCornerSpeed.toFixed(1)} km/h`);

      if (avgCornerSpeed < telemetryData.avgSpeed * 0.5) {
        recommendations.push({
          priority: 'high',
          category: 'cornering',
          title: 'Increase Corner Speed',
          description: 'Your corner speeds are significantly lower than your average speed. Focus on the racing line, proper braking points, and smooth inputs to carry more speed through corners.'
        });
      }
    }

    // General recommendations based on overall performance
    recommendations.push({
      priority: 'medium',
      category: 'consistency',
      title: 'Focus on Consistency',
      description: 'Upload more laps to track your consistency. The best drivers focus on repeatable, consistent laps rather than one-off fast laps.'
    });

    recommendations.push({
      priority: 'low',
      category: 'setup',
      title: 'Setup Optimization',
      description: 'Once you\'re consistent, start experimenting with setup changes. Small adjustments to tire pressure, suspension, and aero can yield significant improvements.'
    });

    // Time savings estimation
    const estimatedImprovement = this.estimateTimeSavings(telemetryData, recommendations);
    insights.push(`\n💡 **Potential Improvement:**`);
    insights.push(`By addressing the recommendations above, you could potentially improve your lap time by ${estimatedImprovement.toFixed(2)} seconds.`);

    return {
      insights: insights.join('\n'),
      recommendations,
      analysis_type: 'rule_based',
      estimatedImprovement
    };
  }

  estimateTimeSavings(telemetryData, recommendations) {
    let totalSavings = 0;

    recommendations.forEach(rec => {
      switch (rec.category) {
        case 'cornering':
          // Better cornering can save 0.5-1.5s per lap
          totalSavings += 1.0;
          break;
        case 'braking':
          // Better braking can save 0.3-0.8s per lap
          totalSavings += 0.5;
          break;
        case 'acceleration':
          // Better acceleration can save 0.4-1.0s per lap
          totalSavings += 0.7;
          break;
        case 'speed':
          // Overall speed improvement can save 0.5-2.0s per lap
          totalSavings += 1.2;
          break;
        default:
          totalSavings += 0.2;
      }
    });

    return totalSavings;
  }

  buildAnalysisPrompt(telemetryData) {
    return `Analyze this sim racing lap telemetry and provide specific coaching advice:

Lap Time: ${telemetryData.lapTime.toFixed(2)}s
Max Speed: ${telemetryData.maxSpeed.toFixed(1)} km/h
Avg Speed: ${telemetryData.avgSpeed.toFixed(1)} km/h
Min Speed: ${telemetryData.minSpeed.toFixed(1)} km/h
Braking Zones: ${telemetryData.brakingPoints.length}
Corners: ${telemetryData.corners.length}
Max Throttle: ${(telemetryData.maxThrottle * 100).toFixed(1)}%
Max Brake: ${(telemetryData.maxBrake * 100).toFixed(1)}%

Provide:
1. Key strengths in the lap
2. Top 3 areas for improvement
3. Specific techniques to implement
4. Estimated time savings possible`;
  }

  extractRecommendations(aiResponse) {
    // Parse AI response and extract structured recommendations
    const recommendations = [];
    const lines = aiResponse.split('\n');

    lines.forEach(line => {
      if (line.includes('improvement') || line.includes('focus') || line.includes('work on')) {
        recommendations.push({
          priority: 'medium',
          category: 'general',
          title: 'AI Recommendation',
          description: line.trim()
        });
      }
    });

    return recommendations.slice(0, 5); // Return top 5
  }

  compareWithReference(userLap, referenceLap) {
    const comparison = {
      timeDifference: userLap.lapTime - referenceLap.lapTime,
      speedDifference: userLap.avgSpeed - referenceLap.avgSpeed,
      sectors: []
    };

    // Divide lap into 3 sectors and compare
    const sectorSize = Math.floor(userLap.dataPoints.length / 3);

    for (let i = 0; i < 3; i++) {
      const start = i * sectorSize;
      const end = (i + 1) * sectorSize;

      const userSector = userLap.dataPoints.slice(start, end);
      const refSector = referenceLap.dataPoints.slice(start, end);

      const userAvgSpeed = userSector.reduce((sum, p) => sum + p.speed, 0) / userSector.length;
      const refAvgSpeed = refSector.reduce((sum, p) => sum + p.speed, 0) / refSector.length;

      comparison.sectors.push({
        sector: i + 1,
        userAvgSpeed,
        refAvgSpeed,
        difference: userAvgSpeed - refAvgSpeed,
        timeLost: ((refAvgSpeed - userAvgSpeed) / refAvgSpeed) * (userLap.lapTime / 3)
      });
    }

    return comparison;
  }
}

module.exports = new AIAnalyzer();
