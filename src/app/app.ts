import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: #0a0a1a;
      width: 100%;
      position: relative;
    }

    .main-content {
      flex: 1;
      margin-left: 72px;
      min-height: 100vh;
      width: calc(100% - 72px);
      min-width: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.28s ease, width 0.28s ease;
    }
  `],
})
export class AppComponent {}
