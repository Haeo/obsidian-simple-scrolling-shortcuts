import {
    App,
    Plugin,
    Editor,
    MarkdownView,
    WorkspaceLeaf,
    PluginSettingTab,
    Setting,
    Notice
} from 'obsidian';
import { EditorView } from '@codemirror/view';

// --- Constants ---
// 부드러운 스크롤 속도 관련
const DEFAULT_SCROLL_SPEED = 3;
const MIN_SCROLL_SPEED = 1;
const MAX_SCROLL_SPEED = 10;
// 단발 스크롤 줄 수 관련
const DEFAULT_SINGLE_SCROLL_LINES = 1;
const MIN_SINGLE_SCROLL_LINES = 1;
const MAX_SINGLE_SCROLL_LINES = 10;


// --- Settings ---
type ScrollMode = 'smooth_repeat' | 'configurable_hotkey';

interface LineScrollerSettings {
    scrollMode: ScrollMode;
    scrollSpeed: number;       // 부드러운 반복 스크롤 속도
    singleScrollLines: number; // 단발 스크롤 시 이동 줄 수 (추가됨)
}

const DEFAULT_SETTINGS: LineScrollerSettings = {
    scrollMode: 'smooth_repeat',
    scrollSpeed: DEFAULT_SCROLL_SPEED,
    singleScrollLines: DEFAULT_SINGLE_SCROLL_LINES // 기본값 추가
}

// --- Main Plugin Class ---
export default class LineScrollerPlugin extends Plugin {
    settings: LineScrollerSettings;
    private animationFrameId: number | null = null;
    private currentScrollDirection: number = 0;

    // --- Plugin Lifecycle Methods ---

    async onload() {
        console.log('Loading Line Scroller plugin');
        await this.loadSettings();
        this.addSettingTab(new LineScrollerSettingTab(this.app, this));
        this.activateCurrentMode();
    }

    onunload() {
        console.log('Unloading Line Scroller plugin');
        this.stopScrolling();
    }

    // --- Settings Management ---

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        // 설정값 범위 검사 및 조정
        this.settings.scrollSpeed = Math.max(MIN_SCROLL_SPEED, Math.min(MAX_SCROLL_SPEED, this.settings.scrollSpeed));
        this.settings.singleScrollLines = Math.max(MIN_SINGLE_SCROLL_LINES, Math.min(MAX_SINGLE_SCROLL_LINES, this.settings.singleScrollLines)); // 새 설정 검사 추가
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // 설정 변경 시 모드 재활성화 (즉시 반영 안될 수 있음, 리로드 권장)
        // this.activateCurrentMode(); // 모드 변경 외에는 즉시 반영되므로 주석 처리하거나 유지
    }

    // --- Mode Activation ---

    activateCurrentMode() {
        // 이전 리스너/커맨드 정리 (Obsidian이 대부분 처리하나 명시적 관리 가능)
        // 여기서는 간단히 필요한 것만 등록하는 방식으로 처리
        if (this.settings.scrollMode === 'smooth_repeat') {
            // Mode 1 활성화 시 Mode 2에서 등록했을 수 있는 Command ID 비활성화 시도 (선택적)
            // this.app.commands.removeCommand(`${this.manifest.id}:scroll-line-up`);
            // this.app.commands.removeCommand(`${this.manifest.id}:scroll-line-down`);
            this.activateSmoothRepeatMode();
        } else { // 'configurable_hotkey'
            // Mode 2 활성화 시 Mode 1에서 등록했을 수 있는 리스너 정리 (선택적)
            // this.stopScrolling(); // 이미 onunload 등에서 처리됨
            this.activateConfigurableHotkeyMode();
        }
    }

    activateSmoothRepeatMode() {
        console.log('Line Scroller: Activating Smooth Repeat Mode');
        this.registerDomEvent(document, 'keydown', this.handleKeyDown.bind(this));
        this.registerDomEvent(document, 'keyup', this.handleKeyUp.bind(this));
        this.registerDomEvent(window, 'blur', this.stopScrolling.bind(this));
    }

    activateConfigurableHotkeyMode() {
        console.log('Line Scroller: Activating Configurable Hotkey Mode');
        this.addCommand({
            id: 'scroll-line-up',
            name: 'Scroll view up (Line Scroller)', // 이름에 플러그인 명시
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.scrollLinesOnce(editor, -1); // -1 for up
            },
            hotkeys: [{ modifiers: ['Ctrl'], key: 'ArrowUp' }],
        });

        this.addCommand({
            id: 'scroll-line-down',
            name: 'Scroll view down (Line Scroller)', // 이름에 플러그인 명시
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.scrollLinesOnce(editor, 1); // 1 for down
            },
            hotkeys: [{ modifiers: ['Ctrl'], key: 'ArrowDown' }],
        });
    }

    // --- Event Handlers (Smooth Repeat Mode Only) ---
    private handleKeyDown(evt: KeyboardEvent) {
        if (!this.isSmoothRepeatModeActive()) return;
        if (!evt.ctrlKey && !evt.metaKey) return;
        let direction = 0;
        if (evt.key === 'ArrowUp') direction = -1;
        else if (evt.key === 'ArrowDown') direction = 1;
        if (direction === 0) return;
        const activeLeaf = this.app.workspace.activeLeaf;
        if (!activeLeaf || !(activeLeaf.view instanceof MarkdownView)) return;
        evt.preventDefault();
        if (this.currentScrollDirection === direction && this.animationFrameId !== null) return;
        this.stopScrolling();
        this.currentScrollDirection = direction;
        this.startSmoothScrollLoop();
    }

    private handleKeyUp(evt: KeyboardEvent) {
        if (!this.isSmoothRepeatModeActive()) return;
        if (evt.key === 'Control' || evt.key === 'Meta' || evt.key === 'ArrowUp' || evt.key === 'ArrowDown') {
            this.stopScrolling();
        }
    }

    private isSmoothRepeatModeActive(): boolean {
        return this.settings.scrollMode === 'smooth_repeat';
    }


    // --- Scrolling Logic ---
    private startSmoothScrollLoop() {
        if (this.animationFrameId === null) {
            const step = () => {
                if (this.currentScrollDirection !== 0) {
                    this.smoothScrollStep();
                    this.animationFrameId = requestAnimationFrame(step);
                } else { this.animationFrameId = null; }
            };
            this.animationFrameId = requestAnimationFrame(step);
        }
    }

    private stopScrolling() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.currentScrollDirection = 0;
    }

    private smoothScrollStep() {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (!activeLeaf || !(activeLeaf.view instanceof MarkdownView)) { this.stopScrolling(); return; }
        const editor = activeLeaf.view.editor;
        try {
            const currentScroll = editor.getScrollInfo();
            // 설정된 '부드러운 스크롤 속도' 사용
            const scrollAmount = this.settings.scrollSpeed * this.currentScrollDirection;
            const newScrollTop = Math.round(currentScroll.top + scrollAmount);
            editor.scrollTo(null, newScrollTop);
        } catch (e) { console.error("Error during smooth scroll step:", e); this.stopScrolling(); }
    }

    /** 단발성 스크롤 실행 (단축키 설정 가능 모드) - 수정됨 */
    private scrollLinesOnce(editor: Editor, direction: number) { // 파라미터 이름 명확화 (direction: -1 or 1)
        let lineHeight = 0;
        // @ts-ignore
        const cm = editor.cm as EditorView;
        if (cm instanceof EditorView) { lineHeight = cm.defaultLineHeight; }
        else { console.error("Line Scroller: Could not access CodeMirror EditorView."); return; }

        if (lineHeight > 0) {
            const currentScroll = editor.getScrollInfo();
            // --- 수정된 부분: 설정된 줄 수(singleScrollLines) 만큼 이동 ---
            const scrollAmount = lineHeight * direction * this.settings.singleScrollLines;
            const newScrollTop = Math.round(currentScroll.top + scrollAmount);
            editor.scrollTo(null, newScrollTop);
        } else { console.error("Line Scroller: Invalid line height obtained."); }
    }
}

// --- Settings Tab ---
class LineScrollerSettingTab extends PluginSettingTab {
    plugin: LineScrollerPlugin;

    constructor(app: App, plugin: LineScrollerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Line Scroller Settings' });

        // --- 작동 모드 선택 UI ---
        new Setting(containerEl)
            .setName('Operating Mode')
            .setDesc('Choose the scrolling behavior. Requires plugin reload or Obsidian restart to apply the change.')
            .addDropdown(dropdown => dropdown
                .addOption('smooth_repeat', 'Smooth Repeat (Fixed Hotkeys: Ctrl/Cmd+Arrows)')
                .addOption('configurable_hotkey', 'Configurable Hotkeys (Single Scroll)')
                .setValue(this.plugin.settings.scrollMode)
                .onChange(async (value: ScrollMode) => {
                    this.plugin.settings.scrollMode = value;
                    // 모드 변경 시 관련 없는 설정은 기본값으로 초기화 (선택적)
                    // if (value === 'smooth_repeat') {
                    //     this.plugin.settings.singleScrollLines = DEFAULT_SETTINGS.singleScrollLines;
                    // } else {
                    //     this.plugin.settings.scrollSpeed = DEFAULT_SETTINGS.scrollSpeed;
                    // }
                    await this.plugin.saveSettings();
                    this.display(); // UI 다시 그리기
                    new Notice('Plugin reload or Obsidian restart required for mode change to take effect.');
                }));

        // --- 모드별 설정 표시 ---
        if (this.plugin.settings.scrollMode === 'smooth_repeat') {
            // 부드러운 반복 스크롤 속도 설정
            new Setting(containerEl)
                .setName('Scroll Speed (Smooth Repeat)')
                .setDesc(`Pixels per frame. Range: ${MIN_SCROLL_SPEED}-${MAX_SCROLL_SPEED}.`)
                .addSlider(slider => slider
                    .setLimits(MIN_SCROLL_SPEED, MAX_SCROLL_SPEED, 1)
                    .setValue(this.plugin.settings.scrollSpeed)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.scrollSpeed = value;
                        await this.plugin.saveSettings();
                    }));
        } else { // configurable_hotkey 모드
            // 단발 스크롤 줄 수 설정 (새로 추가됨)
            new Setting(containerEl)
                .setName('Lines per Scroll (Single Scroll)')
                .setDesc(`Number of lines to scroll per key press. Range: ${MIN_SINGLE_SCROLL_LINES}-${MAX_SINGLE_SCROLL_LINES}.`)
                .addSlider(slider => slider
                    .setLimits(MIN_SINGLE_SCROLL_LINES, MAX_SINGLE_SCROLL_LINES, 1)
                    .setValue(this.plugin.settings.singleScrollLines)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.singleScrollLines = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // --- 단축키 안내 UI (선택된 모드에 따라 다르게 표시) ---
        containerEl.createEl('h3', { text: 'Hotkey Information' });
        const hotkeyDescEl = containerEl.createDiv({ cls: 'setting-item setting-item-description' });

        if (this.plugin.settings.scrollMode === 'smooth_repeat') {
            // 고정 단축키 안내
            hotkeyDescEl.createEl('p', { text: 'In Smooth Repeat mode, hotkeys are fixed:' });
            const listEl = hotkeyDescEl.createEl('ul');
            listEl.createEl('li', { text: 'Scroll Up: Ctrl + Arrow Up (Cmd + Arrow Up on macOS)' });
            listEl.createEl('li', { text: 'Scroll Down: Ctrl + Arrow Down (Cmd + Arrow Down on macOS)' });
        } else { // configurable_hotkey 모드
            // 단축키 설정 안내 및 바로가기 버튼
            hotkeyDescEl.createEl('p', { text: 'In Configurable Hotkeys mode, change hotkeys in Obsidian\'s main settings:' });
            new Setting(hotkeyDescEl)
                .addButton(button => button
                    .setButtonText('Go to Hotkey Settings')
                    .setCta()
                    .onClick(() => {
                        console.log('Go to Hotkey Settings button clicked!');
                        try {
                            const settingsModal = (this.app as any).setting;
                            if (settingsModal && typeof settingsModal.openTabById === 'function') {
                                settingsModal.openTabById('hotkeys');
                            } else {
                                console.warn('Could not navigate directly. Opening general settings.');
                                (this.app as any).commands.executeCommandById('app:open-settings');
                                new Notice('Opened settings. Please navigate to Hotkeys manually.');
                            }
                        } catch (e) {
                            console.error("Error trying to navigate settings tabs:", e);
                            new Notice("Could not navigate automatically.");
                            try { (this.app as any).commands.executeCommandById('app:open-settings'); } catch {}
                        }
                    }));
        }
    }
}