# obsidian-simple-scrolling-shortcuts
 Provides configurable line-based editor scrolling via hotkeys with smooth repeat or single scroll modes.

# 간단한 스크롤 단축키 플러그인 - 옵시디언

커서 위치는 그대로 유지하면서 단축키를 사용해 에디터 뷰를 한 줄 또는 여러 줄 단위로 스크롤 할 수 있는 옵시디언 플러그인

## 주요 기능

* **커서 고정 스크롤:** 커서의 위치는 고정된 상태에서 스크롤 가능
* **2가지 작동 모드:**
    * **1. 부드러운 반복 스크롤 모드:**
        * 단축키 (`Ctrl + 위/아래 방향키` 또는 macOS `Cmd + 위/아래 방향키`)를 누르고 있으면 해당 방향으로 뷰가 부드럽게 스크롤 됨
        * 설정에서 스크롤 속도 조절 가능(프레임당 픽셀, 1~10)
        * 단축키 고정
    * **2. 단축키 변경 가능 모드(단발성 스크롤):**
        * 단축키를 한 번 누를 때마다 설정된 줄 단위 수만큼 뷰가 스크롤 됨
        * 옵시디언의 기본 단축키 설정 메뉴에서 원하는 키로 변경 가능
        * 플러그인 설정에서 한 번에 스크롤할 줄 수 조절 가능(1~5줄)

* **사용자 설정:** 플러그인 설정에서 작동 모드 및 각 모드별 스크롤 옵션을 변경 할 수 있음

## 사용 방법

1. 플러그인을 설치하고 활성화
2. Obsidian 설정 > 커뮤니티 플러그인 > "Simple Scrolling Shortcuts" 설정 탭으로 이동
3. **"작동 모드(Operating Mode)"** 를 선택
    * 모드 변경 후에는 메시지에 따라 플러그인을 리로드하거나 옵시디언을 재시작해야 변경 사항이 완전히 적용 가능
    * 참고사항 : 대체로로 커뮤니티 플러그인에서 해당 플러그인만 껐다가 다시 키면 적용 가능

---

# Simple Scrolling Shortcuts Plugin - Obsidian

Obsidian plugin that allows single or multi-line scrolling of the editor view using hotkeys while maintaining the cursor position.

## Main features.

* **Cursor fixed scrolling:** Allows scrolling while cursor position is fixed
* **2 operation modes:**
    * **1. Smooth looping scroll mode:**
        * Holding down a shortcut key (`Ctrl + Up/Down Arrow Key` or macOS `Cmd + Up/Down Arrow Key`) will smoothly scroll the view in that direction
        * Scroll speed adjustable in settings (pixels per frame, 1-10)
        * Hotkeys are fixed
    * **2. Hotkey changeable mode (one-shot scrolling):**
        * Press the hotkey once to scroll the view.
        * Each single press of the hotkey scrolls the view by the set number of line units
        * Can be changed to your favorite key in Obsidian's default hotkey settings menu
        * Adjustable number of lines to scroll at once in the plugin settings (1-5 lines)

* **Customizable:** You can change the operating modes and scrolling options for each mode in the plugin settings

## How to use

1. install and activate the plugin
2. go to Obsidian Settings > Community Plugins > "Simple Scrolling Shortcuts" settings tab
3. select **"Operating Mode"**.
    * After changing the mode, you will need to reload the plugin or restart Obsidian as prompted for the changes to take full effect
    * Note: For most community plugins, you will only need to toggle the plugin off and on again for the change to take effect
