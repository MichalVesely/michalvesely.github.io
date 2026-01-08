const { parse } = require('csv-parse/sync');
const fs = require('fs').promises;

class TelemetryParser {
  async parseFile(filePath, simType) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true
      });

      if (records.length === 0) {
        throw new Error('No data found in telemetry file');
      }

      // Extract key metrics
      const telemetryData = this.extractMetrics(records, simType);

      return telemetryData;
    } catch (error) {
      console.error('Error parsing telemetry file:', error);
      throw new Error('Failed to parse telemetry file: ' + error.message);
    }
  }

  extractMetrics(records, simType) {
    // Common metrics across all sims
    const metrics = {
      simType,
      totalRecords: records.length,
      lapTime: 0,
      maxSpeed: 0,
      minSpeed: Infinity,
      avgSpeed: 0,
      maxThrottle: 0,
      maxBrake: 0,
      corners: [],
      straightSpeeds: [],
      brakingPoints: [],
      accelerationPoints: []
    };

    let totalSpeed = 0;
    let prevSpeed = 0;

    records.forEach((record, index) => {
      // Try to extract speed from various column names
      const speed = record.Speed || record.speed || record.Velocity || record.velocity || 0;
      const throttle = record.Throttle || record.throttle || record.Gas || record.gas || 0;
      const brake = record.Brake || record.brake || 0;
      const lapTime = record.Time || record.time || record.LapTime || record.laptime || index * 0.016; // Assume 60Hz if no time

      metrics.maxSpeed = Math.max(metrics.maxSpeed, speed);
      metrics.minSpeed = Math.min(metrics.minSpeed, speed);
      totalSpeed += speed;

      metrics.maxThrottle = Math.max(metrics.maxThrottle, throttle);
      metrics.maxBrake = Math.max(metrics.maxBrake, brake);

      // Detect braking points (speed decrease + brake applied)
      if (brake > 0.3 && speed < prevSpeed) {
        metrics.brakingPoints.push({
          time: lapTime,
          speed,
          brake,
          index
        });
      }

      // Detect acceleration points (speed increase + throttle applied)
      if (throttle > 0.5 && speed > prevSpeed) {
        metrics.accelerationPoints.push({
          time: lapTime,
          speed,
          throttle,
          index
        });
      }

      // Detect corners (low speed + high steering)
      const steering = Math.abs(record.Steering || record.steering || record.SteerAngle || 0);
      if (speed < metrics.maxSpeed * 0.6 && steering > 0.3) {
        metrics.corners.push({
          time: lapTime,
          speed,
          steering,
          index
        });
      }

      prevSpeed = speed;
    });

    metrics.avgSpeed = totalSpeed / records.length;
    metrics.lapTime = records[records.length - 1].Time || records[records.length - 1].time || (records.length * 0.016);

    // Store first 1000 data points for visualization
    metrics.dataPoints = records.slice(0, 1000).map((r, i) => ({
      time: r.Time || r.time || i * 0.016,
      speed: r.Speed || r.speed || 0,
      throttle: r.Throttle || r.throttle || 0,
      brake: r.Brake || r.brake || 0,
      steering: r.Steering || r.steering || 0
    }));

    return metrics;
  }

  // Generate demo telemetry data for testing
  generateDemoData(trackName = 'Spa-Francorchamps', carName = 'GT3') {
    const dataPoints = [];
    const duration = 140; // seconds
    const sampleRate = 60; // Hz

    for (let i = 0; i < duration * sampleRate; i++) {
      const t = i / sampleRate;

      // Simulate a lap with corners and straights
      const lapProgress = (t / duration) * Math.PI * 2;

      // Speed varies between 80-280 km/h
      const baseSpeed = 180 + Math.sin(lapProgress * 3) * 100;
      const speed = Math.max(80, Math.min(280, baseSpeed));

      // Throttle and brake inverse relationship
      const throttle = speed > 200 ? 0.9 : (speed > 150 ? 0.7 : 0.3);
      const brake = speed < 120 ? 0.8 : (speed < 160 ? 0.3 : 0);

      // Steering correlates with lower speeds
      const steering = speed < 150 ? (Math.sin(lapProgress * 4) * 0.6) : (Math.sin(lapProgress * 2) * 0.2);

      dataPoints.push({
        Time: t,
        Speed: speed,
        Throttle: throttle,
        Brake: brake,
        Steering: steering
      });
    }

    return {
      simType: 'demo',
      trackName,
      carName,
      totalRecords: dataPoints.length,
      lapTime: duration,
      maxSpeed: 280,
      minSpeed: 80,
      avgSpeed: 180,
      maxThrottle: 0.9,
      maxBrake: 0.8,
      corners: [],
      straightSpeeds: [],
      brakingPoints: [],
      accelerationPoints: [],
      dataPoints: dataPoints.slice(0, 1000)
    };
  }
}

module.exports = new TelemetryParser();
