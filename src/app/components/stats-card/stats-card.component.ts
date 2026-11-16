import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  template: `
    <div class="stats-card" [style.--accent]="color()">
      <div class="card-icon">{{ icon() }}</div>
      <div class="card-content">
        <span class="card-value">{{ value() }}</span>
        <span class="card-label">{{ label() }}</span>
      </div>
      @if (subtext()) {
        <span class="card-subtext">{{ subtext() }}</span>
      }
    </div>
  `,
  styles: [`
    .stats-card {
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--accent, #818cf8);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover {
        border-color: rgba(255, 255, 255, 0.12);
        transform: translateY(-2px);

        &::before {
          opacity: 1;
        }
      }
    }

    .card-icon {
      font-size: 32px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      flex-shrink: 0;
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .card-value {
      font-size: 28px;
      font-weight: 700;
      color: #f3f4f6;
      line-height: 1;
    }

    .card-label {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
    }

    .card-subtext {
      font-size: 11px;
      color: var(--accent, #818cf8);
      font-weight: 500;
      position: absolute;
      bottom: 12px;
      right: 16px;
    }
  `],
})
export class StatsCardComponent {
  icon = input.required<string>();
  value = input.required<string | number>();
  label = input.required<string>();
  color = input<string>('#818cf8');
  subtext = input<string>('');
}

