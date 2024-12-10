// app.js

// Firebase 초기화 (Firebase SDK가 먼저 로드되어야 함)
const firebaseConfig = {
    apiKey: "AIzaSyCovx9T0yyltTwDdNBm2WcJut39P5writg",
    authDomain: "bro-3e72b.firebaseapp.com",
    projectId: "bro-3e72b",
    storageBucket: "bro-3e72b.firebasestorage.app",
    messagingSenderId: "343780882583",
    appId: "1:343780882583:web:ef54f4cddca70bf5e111d2",
    measurementId: "G-EPPSHFW87E"
};

// Firebase 앱 초기화
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Firebase 인증 상태 감지
function monitorAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {

            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("userId", user.uid);

            // 헤더 업데이트
            updateHeader(user.uid);
        } else {

            localStorage.removeItem("loggedIn");
            localStorage.removeItem("userId");

            // 헤더 초기화
            updateHeaderAfterLogout();
        }
    });
}

// 헤더 업데이트 함수
async function updateHeader(userId) {
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        // PC와 모바일에 동적 콘텐츠 업데이트
        const pcUserActions = document.querySelector(".user-actions");
        const mobileUserActions = document.querySelector(".mobile-header .user-actions");
        pcUserActions.innerHTML = `
            <span>${userData.nickname}</span>
            <a href="/profile" onclick="requireLogin(event, '/profile')">나의정보</a>
            <a href="#" onclick="logout(event)">로그아웃</a>
        `;
        mobileUserActions.innerHTML = `
            <span>${userData.nickname}</span>
            <a href="/profile" onclick="requireLogin(event, '/profile')">나의정보</a>
        `;

        updateMobileMenu(userData.nickname);
    } catch (error) {
        console.error("헤더 업데이트 중 오류:", error);
    }
}

// 로그아웃 후 헤더 초기화
function updateHeaderAfterLogout() {
    const pcUserActions = document.querySelector(".user-actions");
    const mobileUserActions = document.querySelector(".mobile-header .user-actions");
    pcUserActions.innerHTML = `
        <a href="/login" onclick="navigateTo(event, '/login')">로그인</a>
        <a href="/signup" onclick="navigateTo(event, '/signup')">회원가입</a>
    `;
    mobileUserActions.innerHTML = `
        <a href="/login" onclick="navigateTo(event, '/login')">로그인</a>
        <a href="/signup" onclick="navigateTo(event, '/signup')">회원가입</a>
    `;
    updateMobileMenu();
}

// 모바일 메뉴 업데이트 함수
function updateMobileMenu(nickname = null) {
    const mobileMenu = document.getElementById("mobileMenu");

    // 동적으로 메뉴 HTML 설정
    mobileMenu.innerHTML = `
        <div class="close-hamburger-menu" id="closeHamburgerMenu">
            <span></span>
            <span></span>
            <span></span>
        </div>
        ${nickname ? `
            <a href="/" onclick="navigateTo(event, '/')">홈</a>
            <a href="/work" onclick="requireLogin(event, '/work')">블로그생성</a>
            <a href="/docs" onclick="requireLogin(event, '/docs')">나의작업</a>
            <a href="/settings" onclick="requireLogin(event, '/settings')">설정하기</a>
            <a href="/guide" onclick="navigateTo(event, '/guide')">가이드</a>
            <a href="/etc" onclick="navigateTo(event, '/etc')">홈페이지제작</a>
            <a href="/payment" onclick="requireLogin(event, '/payment')">결제</a>
            <a href="#" id="logoutLink">로그아웃</a>
        ` : `
            <a href="/work" onclick="requireLogin(event, '/work')">블로그생성</a>
            <a href="/docs" onclick="requireLogin(event, '/docs')">나의작업</a>
            <a href="/settings" onclick="requireLogin(event, '/settings')">설정하기</a>
            <a href="/guide" onclick="navigateTo(event, '/guide')">가이드</a>
            <a href="/etc" onclick="navigateTo(event, '/etc')">홈페이지제작</a>
            <a href="/payment" onclick="requireLogin(event, '/payment')">결제</a>
        `}
    `;

    // 각 링크에 클릭 이벤트 리스너 추가
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.onclick = (event) => {
            const path = link.getAttribute('href');
            if (path === '/work' || path === '/docs' || path === '/settings' || path === '/payment') {
                requireLogin(event, path);
            } else {
                navigateTo(event, path);
            }
            mobileMenu.classList.remove('active');
            document.getElementById('menuOverlay').classList.remove('active');
        };
    });

    // 로그아웃 링크 이벤트 리스너 추가
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
        logoutLink.addEventListener('click', logout);
    }
}


// 햄버거 메뉴 초기화 함수
function initHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');

    // 햄버거 메뉴 클릭 시 모바일 메뉴와 overlay 활성화/비활성화
    hamburgerMenu.onclick = () => {
        mobileMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    };

    // 메뉴 외부(overlay) 클릭 시 메뉴 닫기
    menuOverlay.onclick = () => {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
    };

    // 닫기 아이콘에 대한 클릭 이벤트 리스너 추가
    document.addEventListener('click', () => {
        const closeHamburgerMenu = document.getElementById('closeHamburgerMenu');
        if (closeHamburgerMenu) {
            closeHamburgerMenu.onclick = () => {
                mobileMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
            };
        }
    });
}


///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
// 로그인 및 회원가입 코드


function logout(event) {
    event.preventDefault();
    auth.signOut().then(() => {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("userId");

        // 헤더와 모바일 메뉴 상태 초기화
        updateHeaderAfterLogout();

        // 모바일 메뉴 상태를 업데이트하고 닫음
        updateMobileMenu();
        const mobileMenu = document.getElementById('mobileMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');

        // 홈 화면으로 이동
        navigateTo(event, "/");
    }).catch((error) => {
        console.error("로그아웃 중 오류:", error);
    });
}


// 이메일 패턴 확인
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 유효성 검사 함수
function validateInput(usernameInput, passwordInput, confirmPasswordInput, emailInput) {
    // 아이디 유효성 검사
    if (usernameInput.value.length < 6) {
        usernameInput.style.color = "red";
    } else {
        usernameInput.style.color = "black";
    }

    // 비밀번호 유효성 검사
    if (passwordInput.value.length < 8) {
        passwordInput.style.color = "red";
    } else {
        passwordInput.style.color = "black";
    }

    // 비밀번호 확인 검사
    if (confirmPasswordInput.value !== passwordInput.value) {
        confirmPasswordInput.style.color = "red";
    } else {
        confirmPasswordInput.style.color = "black";
    }

    // 이메일 유효성 검사
    if (!emailPattern.test(emailInput.value)) {
        emailInput.style.color = "red";
    } else {
        emailInput.style.color = "black";
    }
}

// 회원가입 폼 초기화 함수
function initSignupForm() {
    const signupForm = document.getElementById("signupForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const emailInput = document.getElementById("email");

    // 이메일 패턴 확인
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    function validateInput() {
        // 아이디 유효성 검사
        usernameInput.style.color = usernameInput.value.length < 6 ? "red" : "black";

        // 비밀번호 유효성 검사
        passwordInput.style.color = passwordInput.value.length < 8 ? "red" : "black";

        // 비밀번호 확인 검사
        confirmPasswordInput.style.color = (confirmPasswordInput.value !== passwordInput.value) ? "red" : "black";

        // 이메일 유효성 검사
        emailInput.style.color = !emailPattern.test(emailInput.value) ? "red" : "black";
    }

    if (signupForm) {
        usernameInput.addEventListener("input", validateInput);
        passwordInput.addEventListener("input", validateInput);
        confirmPasswordInput.addEventListener("input", validateInput);
        emailInput.addEventListener("input", validateInput);

        signupForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            validateInput();

            if (usernameInput.value.length < 6 ||
                passwordInput.value.length < 8 ||
                confirmPasswordInput.value !== passwordInput.value ||
                !emailPattern.test(emailInput.value)) {
                alert("입력 조건을 확인해 주세요.");
                return;
            }

            try {
                const normalizedUsername = usernameInput.value.trim().toLowerCase();

                const usernameQuery = await db.collection("users").where("username", "==", normalizedUsername).get();
                if (!usernameQuery.empty) {
                    alert("이미 존재하는 아이디입니다.");
                    return;
                }

                const emailQuery = await db.collection("users").where("email", "==", emailInput.value).get();
                if (!emailQuery.empty) {
                    alert("이미 가입된 이메일입니다.");
                    return;
                }

                const userCredential = await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
                const user = userCredential.user;

                await db.collection("users").doc(user.uid).set({
                    username: normalizedUsername,
                    email: emailInput.value,
                    nickname: document.getElementById("nickname").value
                });

                alert("회원가입이 완료되었습니다.");
                updateHeader(user.uid);
                navigateTo(event, "/");
            } catch (error) {
                console.error("회원가입 중 오류:", error);
                alert("회원가입 중 문제가 발생했습니다.");
            }
        });
    }
}

// 로그인 페이지 로드 시 이벤트 리스너 추가
async function initializeLogin() {
    // 로그인 폼 요소
    const loginForm = document.getElementById("loginForm");
    const loginEmailOrUsername = document.getElementById("loginEmailOrUsername");
    const loginPassword = document.getElementById("loginPassword");

    // 로그인 이벤트
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const loginValue = loginEmailOrUsername.value.trim().toLowerCase(); // 소문자로 변환하고 공백 제거
        const password = loginPassword.value;

        try {
            let userCredential;

            if (emailPattern.test(loginValue)) {
                // 이메일 형식인 경우 Firebase Authentication 사용
                userCredential = await auth.signInWithEmailAndPassword(loginValue, password);
            } else {
                // username으로 로그인하려는 경우 Firestore에서 이메일 조회
                const querySnapshot = await db.collection("users").where("username", "==", loginValue).get();
                if (querySnapshot.empty) {
                    throw new Error("존재하지 않는 아이디입니다.");
                }

                const email = querySnapshot.docs[0].data().email;
                userCredential = await auth.signInWithEmailAndPassword(email, password);
            }

            const user = userCredential.user;

            // 로그인 성공 시 로컬 저장소에 로그인 상태 저장
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("userId", user.uid);

            // 헤더 업데이트
            updateHeader(user.uid);

            // 홈 화면으로 이동
            navigateTo(event, "/");
        } catch (error) {
            console.error("로그인 중 오류:", error.message);
            alert("로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.");
        }
    });

}

// 초기 로드 및 뒤로/앞으로 버튼 대응
window.addEventListener("DOMContentLoaded", () => {
    initHamburgerMenu(); // 페이지 최초 로드 시 햄버거 메뉴 초기화
    router(window.location.pathname);
    window.onpopstate = () => router(window.location.pathname);
});

// 로그인 상태 확인 (임시로 localStorage 사용)
const isLoggedIn = () => localStorage.getItem('loggedIn') === 'true';

// 페이지 이동 함수
function navigateTo(event, path) {
    event.preventDefault();
    history.pushState(null, null, path);
    router(path);
}

// 로그인 필요 함수
function requireLogin(event, path) {
    event.preventDefault();
    const loggedIn = localStorage.getItem("loggedIn") === "true";

    if (loggedIn) {
        navigateTo(event, path);
    } else {
        alert("로그인이 필요합니다.");
        navigateTo(event, "/login");
    }
}


///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
// 페이지 로드 코드



// 라우터 함수: 설정 페이지에 처음 진입할 때만 settings.html을 불러오도록 수정
async function router(path) {
    const content = document.getElementById("content");

    // 설정 페이지가 아닌 경우 먼저 클래스 제거
    document.body.classList.remove("settings-page");
    document.body.classList.remove("guide-page");

    let page = "";

    switch (path) {
        case "/work":
            page = await fetchPage("work.html");
            content.innerHTML = page;

            // 작업 페이지가 로드된 후 등록된 블로그 목록을 불러옵니다.
            setTimeout(loadRegisteredBlogs, 0);
            setTimeout(loadSavedPrompts, 0); // 프롬프트 불러오기
            setTimeout(loadSavedSettings, 0);
            setTimeout(loadLastAppliedSettings, 1000);
            break;
        case "/docs":
            page = await fetchPage("docs.html");
            content.innerHTML = page;
            loadPostHistory();
            break;
        case "/settings":
            // 매번 settings.html을 로드하여 초기화
            page = await fetchPage("settings.html");
            content.innerHTML = page;
            showContent("status"); // 초기 상태로 status를 표시
            initSettingsPage(); // 설정 페이지 초기화
            document.body.classList.add("settings-page"); // 설정 페이지에만 클래스 추가
            return; // 추가 설정 방지
        case "/guide":
            page = await fetchPage("guide.html");
            content.innerHTML = page;
            loadGuideContent("api-overview"); //
            initGuidePage();
            document.body.classList.add("guide-page"); // 가이드 페이지에만 클래스 추가
            break;
        case "/etc":
            page = "<h2>홈페이지 제작 및 문의 페이지</h2><br><hr><br><p>홈페이지 제작에 대한 전반적인 내용과 문의에 대한 내용이 담기는 페이지. 또한 블로그 관리 및 기타 여러가지 항목이 추가 될 수 있고 이후 여러 항목이 추가될경우 상단의 카테고리 세분화하여 분리 예정.</p>";
            break;
        case "/payment":
            page = "<h2>결제 페이지</h2><br><hr><br><p>결제 금액은 사용 가능한 기능별로 표로 표시하여 등급별로 책정할 예정. 카드 결제 및 계좌이체를 채용.</p>";
            break;
        case "/login":
            page = await fetchPage("login.html");
            setTimeout(initializeLogin, 0);
            break;
        case "/signup":
            page = await fetchPage("signup.html");
            setTimeout(initSignupForm, 0);
            break;
        default:
            page = `
                <h1>프로그램 또는 회사 소개 페이지</h1>
                <br><hr><br>
                <p>
                    블로그 자동 포스팅 프로그램에 대한 간략한 소개 및 홍보성 글과 이미지, 영상이 포함되고 차후 블로그 포스팅뿐 아니라
                    홈페이지 및 기타 항목이 늘어날 경우 전반적인 내용과 각 카테고리에 대한 설명, 회사 소개 페이지가 될 예정.
                </p>
                <br>
                <button onclick="startAssistDirectly()">어시스트 시작</button>
            `;
            content.innerHTML = page; // 콘텐츠 영역에 삽입
            setTimeout(monitorAuthState, 0); // 인증 상태 감시
    }

    // 페이지가 설정 또는 가이드 페이지가 아닌 경우만 content 업데이트
    if (path !== "/settings" && path !== "/guide") {
        content.innerHTML = page;
    }
    initHamburgerMenu(); // 각 페이지 전환 후 햄버거 메뉴 초기화
}


// 페이지 콘텐츠 로드 함수
async function fetchPage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("페이지 로드 실패");
        return await response.text();
    } catch (error) {
        console.error("Error loading page:", error);
        return "<p>페이지를 불러오는 중 문제가 발생했습니다.</p>";
    }
}

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
//API 설정 및 블로그 등록 코드

// 사이드바 열고 닫는 함수
function toggleSettingsSidebar() {
    const sidebar = document.querySelector('.settings-sidebar');
    const overlay = document.querySelector('.settings-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
}

// 외부 클릭 시 사이드바 닫기
function closeSettingsSidebar() {
    const sidebar = document.querySelector('.settings-sidebar');
    const overlay = document.querySelector('.settings-overlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
}

// 초기화 함수에서 항목 클릭 시 사이드바 닫기 추가
function initSettingsPage() {
    document.querySelectorAll(".settings-sidebar a").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const contentType = event.target.getAttribute("onclick").match(/showContent\('(\w+)'\)/)[1];
            showContent(contentType);

            // 모바일 화면에서는 클릭 시 사이드바 닫기
            if (window.innerWidth <= 768) {
                closeSettingsSidebar();
            }
        });
    });

    // 외부 클릭 시 사이드바 닫기 설정
    const overlay = document.querySelector('.settings-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeSettingsSidebar);
    }
}

// 사이드바 하이라이트 및 콘텐츠 업데이트 함수
function updateSidebarHighlight(contentType) {
    const sidebarLinks = document.querySelectorAll(".settings-sidebar a");

    sidebarLinks.forEach(link => {
        // getAttribute로 가져온 onclick 내용에서 정확히 일치하는 contentType만 하이라이트
        const onclickContent = link.getAttribute("onclick");
        if (onclickContent === `showContent('${contentType}')`) {
            link.classList.add("selected");
        } else {
            link.classList.remove("selected");
        }
    });
}


// 콘텐츠를 사이드바 항목에 따라 업데이트하는 함수
function showContent(contentType) {
    const settingsContent = document.getElementById("settingsContent");
    if (!settingsContent) return;

    // 현재 표시된 내용을 저장하고 중복 호출 방지
    if (settingsContent.dataset.currentContent === contentType) return;
    settingsContent.dataset.currentContent = contentType;
    updateSidebarHighlight(contentType);

    switch (contentType) {
        case 'status':
            settingsContent.innerHTML = `
                <h2>API 연결 상태</h2>
                <div class="status-box-container">
                    <div class="status-box" id="statusOpenAI">
                        <p>OpenAI</p>
                        <span class="status">확인 중...</span>
                    </div>
                    
                    <div class="status-box" id="statusGoogleAPI">
                        <p>Google API</p>
                        <span class="status">확인 중...</span>
                    </div>
                    <div class="status-box" id="statusCloudinary">
                        <p>Cloudinary</p>
                        <span class="status">확인 중...</span>
                    </div>
                    <div class="status-box" id="statusPixabay">
                        <p>Pixabay</p>
                        <span class="status">확인 중...</span>
                    </div>
                    <div class="status-box" id="statusCoupang">
                        <p>쿠팡 파트너스</p>
                        <span class="status">확인 중...</span>
                    </div>
                </div>

                <h2>블로그 등록 상태</h2>
                <div class="blog-status-container">
                    <div class="blog-status-box" id="statusWordpress">
                        <p>워드프레스</p>
                        <span class="count">0개 등록됨</span>
                    </div>
                    <div class="blog-status-box" id="statusGoogleBlog">
                        <p>구글 블로그</p>
                        <span class="count">0개 등록됨</span>
                    </div>
                </div>
            `;
            // gemini 추가 시 아래 코드 삽입
            // <div class="status-box" id="statusGemini">
            //             <p>Gemini</p>
            //             <span class="status">확인 중...</span>
            //         </div>


            // 3초 후에 '확인 중...' 상태가 지속되면 checkAPIConnections 실행
            setTimeout(() => {
                const statusElements = settingsContent.querySelectorAll(".status-box .status");
                
                // '확인 중...' 상태가 지속되는지 확인
                const needsCheck = Array.from(statusElements).some(element => element.textContent === "확인 중...");
                
                if (needsCheck) {
                    checkAPIConnections();
                }
            }, 3000);

            // API 상태 확인 함수 실행
            checkAPIConnections();
            break;

        // OpenAI 설정 UI
        case 'openai':
        settingsContent.innerHTML = `
            <h2 style="font-size: 2em; margin-bottom: 10px;">OpenAI 설정</h2>
            <br><br>
            <div class="api-settings">
                <label class="api-label">API 키:</label>
                <input type="text" id="openaiApiKey" placeholder="OpenAI API 키 입력" class="api-input">
                <button onclick="saveOpenAiSettings()" class="api-save-button">저장</button>
            </div>

            <hr style="margin: 20px 0; border-color: #666;">
            
            <h2 style="font-size: 1.5em; margin-bottom: 5px;">연결 상태</h2>
            <span id="openaiConnectionStatus" style="font-size: 1.5em; font-weight: bold;">연결 안됨</span>
            
            <hr style="margin: 20px 0; border-color: #666;">

            <h2 style="font-size: 1.5em; margin-bottom: 10px;">OpenAI API 발급 가이드</h2>
            <p style="font-size: 1em; color: #ccc; margin-bottom: 10px;">
                OpenAI API 키는 OpenAI 계정에서 발급받아 사용할 수 있습니다.
                아래 가이드를 참조하여 API 키를 생성하세요.
            </p>
            <button onclick="redirectToGuide('openai')" class="api-guide-button">가이드</button>
            `;

        // Firestore에서 저장된 API 키 불러오기
        setTimeout(loadOpenAiSettings, 100);
        break;

        case 'gemini':
            settingsContent.innerHTML = `
                <h2 style="font-size: 2em; margin-bottom: 10px;">Gemini 설정</h2>
                <br><br>
                <div class="api-settings">
                    <label class="api-label">API 키:</label>
                    <input type="text" id="geminiApiKey" placeholder="Gemini API 키 입력" class="api-input">
                    <button onclick="saveGeminiSettings()" class="api-save-button">저장</button>
                </div>

                <hr style="margin: 20px 0; border-color: #666;">
                
                <h2 style="font-size: 1.5em; margin-bottom: 5px;">연결 상태</h2>
                <span id="geminiConnectionStatus" style="font-size: 1.5em; font-weight: bold;">연결 안됨</span>
                
                <hr style="margin: 20px 0; border-color: #666;">

                <h2 style="font-size: 1.5em; margin-bottom: 10px;">Gemini API 발급 가이드</h2>
                <p style="font-size: 1em; color: #ccc; margin-bottom: 10px;">
                    Gemini API 키는 관련 계정에서 발급받아 사용할 수 있습니다.
                    아래 가이드를 참조하여 API 키를 생성하세요.
                </p>
                <button onclick="redirectToGuide('gemini')" class="api-guide-button">가이드</button>
            `;

        // Firestore에서 저장된 API 키 불러오기
        setTimeout(loadGeminiSettings, 100);
        break;


        // WordPress 설정 화면
        case 'wordpress':
            settingsContent.innerHTML = `
                <h2 style="font-size: 2em; margin-bottom: 10px;">워드프레스 설정</h2>
                <br><br>
                <div class="wordpress-settings">
                    <label class="wp-label">내 워드프레스 사이트 주소:</label>
                    <input type="text" id="wpSiteUrl" class="wp-input" placeholder="사이트 주소 입력">
                    
                    <label class="wp-label">내 워드프레스 유저 이름:</label>
                    <input type="text" id="wpUsername" class="wp-input" placeholder="유저 이름 입력">
                    
                    <label class="wp-label">내 워드프레스 응용 프로그램 비밀번호:</label>
                    <input type="password" id="wpAppPassword" class="wp-input" placeholder="응용 프로그램 비밀번호 입력">
                    
                    <button onclick="saveWordpressSettings()" class="wp-save-button">저장</button>
                    <button onclick="cancelEditWordpress()" class="wp-cancel-button" style="display: none;">취소</button>
                </div>
                
                <hr style="margin: 20px 0; border-color: #666;">
                
                <h2 style="font-size: 1.5em; margin-bottom: 5px;">등록된 워드프레스</h2>
                <div id="registeredWordpressList"></div>
                
                <hr style="margin: 20px 0; border-color: #666;">
                
                <h2 style="font-size: 1.5em; margin-bottom: 10px;">워드프레스 생성 가이드</h2>
                <p style="font-size: 1em; color: #ccc; margin-bottom: 10px;">
                    워드프레스 API 키를 생성하고 관리하는 방법에 대한 가이드는 아래 버튼을 클릭하세요.
                </p>
                <button onclick="redirectToGuide('wordpress-create')" class="wp-guide-button">가이드</button>
            `;

            // Firestore에서 저장된 데이터 불러오기
            setTimeout(loadWordpressSettings, 100);
            break;
        

            case 'google':
                settingsContent.innerHTML = `
                    <h2 style="font-size: 2em; margin-bottom: 10px;">구글 블로그 설정</h2>
                    <br><br>
                    <div class="google-settings">
                        <label class="google-label">내 구글 블로그 주소:</label>
                        <input type="text" id="googleBlogUrl" class="google-input" placeholder="블로그 주소 입력">

                        <label class="google-label">내 구글 블로그 ID:</label>
                        <input type="text" id="googleBlogId" class="google-input" placeholder="블로그 ID 입력">

                        <label class="google-label">내 구글 클라이언트 ID:</label>
                        <input type="text" id="googleClientId" class="google-input" placeholder="클라이언트 ID 입력">

                        <label class="google-label">내 구글 클라이언트 시크릿:</label>
                        <input type="password" id="googleClientSecret" class="google-input" placeholder="클라이언트 시크릿 입력">

                        <label class="google-label">리프레시 토큰:</label>
                        <input type="text" id="googleRefreshToken" class="google-input" placeholder="리프레시 토큰 입력">

                        <button onclick="saveGoogleBlogSettings()" class="google-save-button">저장</button>
                        <button onclick="cancelEditGoogleBlog()" class="google-cancel-button" style="display: none;">취소</button>
                    </div>

                    <hr style="margin: 20px 0; border-color: #666;">

                    <h2 style="font-size: 1.5em; margin-bottom: 5px;">등록된 구글 블로그</h2>
                    <div id="registeredGoogleBlogList"></div>

                    <hr style="margin: 20px 0; border-color: #666;">

                    <h2 style="font-size: 1.5em; margin-bottom: 10px;">구글 블로그 생성 가이드</h2>
                    <p style="font-size: 1em; color: #ccc; margin-bottom: 10px;">
                        구글 블로그 API 키를 생성하고 관리하는 방법에 대한 가이드는 아래 버튼을 클릭하세요.
                    </p>
                    <button onclick="showGoogleBlogGuidePopup()" class="google-guide-button">가이드</button>
                `;

                // Firestore에서 저장된 데이터 불러오기
                setTimeout(loadGoogleBlogSettings, 100);
            break;
        
        // Google Image 설정 UI
            case 'googleImage':
                settingsContent.innerHTML = `
                    <h2 style="font-size: 2em; margin-bottom: 10px;">Google 이미지 검색 설정</h2>
                    <br><br>
                    <div class="api-settings">
                        <label class="api-label">API 키:</label>
                        <input type="text" id="googleImageApiKey" placeholder="Google Image API 키 입력" class="api-input">
                    </div>
                    <div class="api-settings">
                        <label class="api-label">검색 엔진 ID (CX):</label>
                        <input type="text" id="googleImageCx" placeholder="Google 검색 엔진 ID (CX) 입력" class="api-input">
                        <button onclick="saveGoogleImageSettings()" class="api-save-button">저장</button>
                    </div>

                    <hr style="margin: 20px 0; border-color: #666;">
                    
                    <h2 style="font-size: 1.5em; margin-bottom: 5px;">연결 상태</h2>
                    <span id="googleImageConnectionStatus" style="font-size: 1.5em; font-weight: bold;">연결 안됨</span>
                    
                    <hr style="margin: 20px 0; border-color: #666;">

                    <h2 style="font-size: 1.5em; margin-bottom: 10px;">Google Image API 발급 가이드</h2>
                    <p style="font-size: 1em; color: #ccc; margin-bottom: 10px;">
                        Google 이미지 검색 API 키는 Google Cloud Console에서 발급받을 수 있으며,
                        검색 엔진 ID (CX)는 Google Custom Search Engine에서 생성할 수 있습니다.
                        아래 가이드를 참조하여 API 키와 검색 엔진 ID를 생성하세요.
                    </p>
                    <button onclick="showGoogleImageGuidePopup()" class="api-guide-button">가이드</button>
                `;

                // Firestore에서 저장된 Google Image API 키 및 CX 불러오기
                setTimeout(loadGoogleImageSettings, 100);
            break;
        
        // Cloudinary 설정 UI
            case 'cloudinary':
                settingsContent.innerHTML = `
                    <h2 style="font-size: 2em; margin-bottom: 10px;">Cloudinary 설정</h2>
                    <br><br>
                    <div class="api-settings">
                        <label class="api-label">클라우드 이름:</label>
                        <input type="text" id="cloudinaryCloudName" placeholder="Cloudinary 클라우드 이름 입력" class="api-input">
                    </div>
                    <div class="api-settings">
                        <label class="api-label">API 키:</label>
                        <input type="text" id="cloudinaryApiKey" placeholder="Cloudinary API 키 입력" class="api-input">
                    </div>
                    <div class="api-settings">
                        <label class="api-label">API 비밀:</label>
                        <input type="password" id="cloudinaryApiSecret" placeholder="Cloudinary API 비밀 입력" class="api-input">
                    </div>
                    <button onclick="saveCloudinarySettings()" class="api-save-button">저장</button>

                    <hr style="margin: 20px 0; border-color: #666;">
                    
                    <h2 style="font-size: 1.5em; margin-bottom: 5px;">연결 상태</h2>
                    <span id="cloudinaryConnectionStatus" style="font-size: 1.5em; font-weight: bold;">연결 안됨</span>
                    
                    <hr style="margin: 20px 0; border-color: #666;">

                    <h2 style="font-size: 1.5em; margin-bottom: 10px;">Cloudinary API 발급 가이드</h2>
                    <p style="font-size: 1em; color: #ccc; margin-bottom: 10px;">
                        Cloudinary API 키, 클라우드 이름, API 비밀은 Cloudinary 계정에서 발급받을 수 있습니다.
                        아래 가이드를 참조하여 API 키를 생성하세요.
                    </p>
                    <button onclick="showCloudinaryGuidePopup()" class="api-guide-button">가이드</button>
                `;

                // Firestore에서 저장된 Cloudinary 설정 불러오기
                setTimeout(loadCloudinarySettings, 100);
            break;
        
        // Pixabay 설정 UI
            case 'pixabay':
                settingsContent.innerHTML = `
                    <h2 style="font-size: 2em; margin-bottom: 10px;">Pixabay 설정</h2>
                    <br><br>
                    <div class="api-settings">
                        <label class="api-label">API 키:</label>
                        <input type="text" id="pixabayApiKey" placeholder="Pixabay API 키 입력" class="api-input">
                        <button onclick="savePixabaySettings()" class="api-save-button">저장</button>
                    </div>

                    <hr style="margin: 20px 0; border-color: #666;">
                    
                    <h2 style="font-size: 1.5em; margin-bottom: 5px;">연결 상태</h2>
                    <span id="pixabayConnectionStatus" style="font-size: 1.5em; font-weight: bold;">연결 안됨</span>
                    
                    <hr style="margin: 20px 0; border-color: #666;">

                    <h2 style="font-size: 1.5em; margin-bottom: 10px;">Pixabay API 발급 가이드</h2>
                    <p style="font-size: 1em; color: #ccc; margin-bottom: 10px;">
                        Pixabay API 키는 Pixabay 계정에서 발급받을 수 있습니다. 아래 가이드를 참조하여 API 키를 생성하세요.
                    </p>
                    <button onclick="showPixabayGuidePopup()" class="api-guide-button">가이드</button>
                `;

                // Firestore에서 저장된 Pixabay API 키 불러오기
                setTimeout(loadPixabaySettings, 100);
            break;
        
        // 쿠팡 파트너스 설정 UI
            case 'coupang':
                settingsContent.innerHTML = `
                    <h2 style="font-size: 2em; margin-bottom: 10px;">쿠팡 파트너스 설정</h2>
                    <br><br>
                    <div class="api-settings">
                        <label class="api-label">API 키:</label>
                        <input type="text" id="coupangApiKey" placeholder="쿠팡 파트너스 API 키 입력" class="api-input">
                    </div>
                    <div class="api-settings">
                        <label class="api-label">시크릿 키:</label>
                        <input type="password" id="coupangApiSecret" placeholder="쿠팡 파트너스 시크릿 키 입력" class="api-input">
                    </div>
                    <button onclick="saveCoupangSettings()" class="api-save-button">저장</button>

                    <hr style="margin: 20px 0; border-color: #666;">
                    
                    <h2 style="font-size: 1.5em; margin-bottom: 5px;">연결 상태</h2>
                    <span id="coupangConnectionStatus" style="font-size: 1.5em; font-weight: bold;">연결 안됨</span>
                    
                    <hr style="margin: 20px 0; border-color: #666;">

                    <h2 style="font-size: 1.5em; margin-bottom: 10px;">쿠팡 파트너스 API 발급 가이드</h2>
                    <p style="font-size: 1em; color: #ccc; margin-bottom: 10px;">
                        쿠팡 파트너스 API 키와 시크릿 키는 쿠팡 파트너스 계정에서 발급받을 수 있습니다.
                        아래 가이드를 참조하여 API 키를 생성하세요.
                    </p>
                    <button onclick="showCoupangGuidePopup()" class="api-guide-button">가이드</button>
                `;

                // Firestore에서 저장된 쿠팡 파트너스 설정 불러오기
                setTimeout(loadCoupangSettings, 100);
                break;


        // 기타 항목들 추가 가능
    }
}

// 가이드 화면으로 이동하는 함수
function redirectToGuide(contentType) {
    // 가이드 화면으로 라우팅
    history.pushState(null, null, '/guide');
    router('/guide');

    // 가이드 페이지 로드 후 원하는 콘텐츠 표시
    const interval = setInterval(() => {
        const guideContent = document.getElementById("guideContent");
        if (guideContent) {
            clearInterval(interval);
            loadGuideContent(contentType);
        }
    }, 100);
}

// 현재 사이드바 상태에 따라 API 연결 상태를 업데이트하는 함수
async function updateStatus(elementId, service) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
        const response = await fetch(`https://www.dokdolove.com/api/${service}/${userId}`);
        const result = await response.json();
        const connected = result.ok;
        const element = document.getElementById(elementId);

        if (element) { // 요소가 존재하는지 확인
            if (settingsContent.dataset.currentContent === 'status') {
                // 사이드바가 현재 상태일 때
                element.querySelector('.status').textContent = connected ? "연결됨" : "연결 안됨";
                element.querySelector('.status').classList.remove("connected", "disconnected");
                element.querySelector('.status').classList.add(connected ? "connected" : "disconnected");
            } else {
                // 사이드바가 다른 항목일 때
                element.textContent = connected ? "연결됨" : "연결 안됨";

                element.style.color = connected ? "green" : "red";
            }
        }
    } catch (error) {
        console.error(`${service} API 유효성 확인 오류:`, error);
    }
}


// API 연결 상태 확인 함수
async function checkAPIConnections() {
    await updateStatus("statusOpenAI", "openai");
    await updateStatus("statusGemini", "gemini");
    await updateStatus("statusGoogleAPI", "googleimage");
    await updateStatus("statusCloudinary", "cloudinary");
    await updateStatus("statusPixabay", "pixabay");
    await updateStatus("statusCoupang", "coupang");

    await updateBlogStatusCount();
}



// OpenAI 설정 불러오기 및 유효성 검사
async function loadOpenAiSettings() {
    const apiKeyInput = document.getElementById("openaiApiKey");

    try {
        const userId = auth.currentUser.uid;
        const doc = await db.collection("settings").doc(userId).get();
        const data = doc.data();

        if (data?.openAIKey) {
            apiKeyInput.value = data.openAIKey;
            await updateStatus("openaiConnectionStatus", "openai");
        }
    } catch (error) {
        console.error("OpenAI API 키 불러오기 오류:", error);
    }
}

// OpenAI 설정 저장 및 유효성 검사 업데이트
async function saveOpenAiSettings() {
    const apiKey = document.getElementById("openaiApiKey").value;

    try {
        const userId = auth.currentUser.uid;
        await db.collection("settings").doc(userId).set(
            { openAIKey: apiKey },
            { merge: true }
        );

        await updateStatus("openaiConnectionStatus", "openai");
        alert("OpenAI API 키가 저장되었습니다.");
    } catch (error) {
        console.error("API 키 저장 오류:", error);
        alert("API 키 저장 중 오류가 발생했습니다.");
    }
}

// Gemini 설정 불러오기 및 유효성 검사
async function loadGeminiSettings() {
    const apiKeyInput = document.getElementById("geminiApiKey");

    try {
        const userId = auth.currentUser.uid;
        const doc = await db.collection("settings").doc(userId).get();
        const data = doc.data();

        if (data?.geminiKey) {
            apiKeyInput.value = data.geminiKey;
            await updateStatus("geminiConnectionStatus", "gemini");
        }
    } catch (error) {
        console.error("Gemini API 키 불러오기 오류:", error);
    }
}

// Gemini 설정 저장 및 유효성 검사 업데이트
async function saveGeminiSettings() {
    const apiKey = document.getElementById("geminiApiKey").value;

    try {
        const userId = auth.currentUser.uid;
        await db.collection("settings").doc(userId).set(
            { geminiKey: apiKey },
            { merge: true }
        );

        await updateStatus("geminiConnectionStatus", "gemini");
        alert("Gemini API 키가 저장되었습니다.");
    } catch (error) {
        console.error("API 키 저장 오류:", error);
        alert("API 키 저장 중 오류가 발생했습니다.");
    }
}

// Google Image 설정 불러오기 및 유효성 검사
async function loadGoogleImageSettings() {
    const apiKeyInput = document.getElementById("googleImageApiKey");
    const cxInput = document.getElementById("googleImageCx");

    try {
        const userId = auth.currentUser.uid;
        const doc = await db.collection("settings").doc(userId).get();
        const data = doc.data();

        if (data?.googleImageApiKey && data?.googleImageCx) {
            apiKeyInput.value = data.googleImageApiKey;
            cxInput.value = data.googleImageCx;
            await updateStatus("googleImageConnectionStatus", "googleimage");
        }
    } catch (error) {
        console.error("Google Image API 키 불러오기 오류:", error);
    }
}

// Google Image 설정 저장 및 유효성 검사 업데이트
async function saveGoogleImageSettings() {
    const apiKey = document.getElementById("googleImageApiKey").value;
    const cx = document.getElementById("googleImageCx").value;

    try {
        const userId = auth.currentUser.uid;
        await db.collection("settings").doc(userId).set(
            { googleImageApiKey: apiKey, googleImageCx: cx },
            { merge: true }
        );

        await updateStatus("googleImageConnectionStatus", "googleimage");
        alert("Google Image API 키가 저장되었습니다.");
    } catch (error) {
        console.error("API 키 저장 오류:", error);
        alert("API 키 저장 중 오류가 발생했습니다.");
    }
}

// Cloudinary 설정 불러오기 및 유효성 검사
async function loadCloudinarySettings() {
    const cloudNameInput = document.getElementById("cloudinaryCloudName");
    const apiKeyInput = document.getElementById("cloudinaryApiKey");
    const apiSecretInput = document.getElementById("cloudinaryApiSecret");

    try {
        const userId = auth.currentUser.uid;
        const doc = await db.collection("settings").doc(userId).get();
        const data = doc.data();

        if (data) {
            if (data.cloudinaryCloudName) cloudNameInput.value = data.cloudinaryCloudName;
            if (data.cloudinaryApiKey) apiKeyInput.value = data.cloudinaryApiKey;
            if (data.cloudinaryApiSecret) apiSecretInput.value = data.cloudinaryApiSecret;
            await updateStatus("cloudinaryConnectionStatus", "cloudinary");
        }
    } catch (error) {
        console.error("Cloudinary 설정 불러오기 오류:", error);
    }
}

// Cloudinary 설정 저장 및 유효성 검사 업데이트
async function saveCloudinarySettings() {
    const cloudName = document.getElementById("cloudinaryCloudName").value;
    const apiKey = document.getElementById("cloudinaryApiKey").value;
    const apiSecret = document.getElementById("cloudinaryApiSecret").value;

    try {
        const userId = auth.currentUser.uid;
        await db.collection("settings").doc(userId).set(
            {
                cloudinaryCloudName: cloudName,
                cloudinaryApiKey: apiKey,
                cloudinaryApiSecret: apiSecret
            },
            { merge: true }
        );

        await updateStatus("cloudinaryConnectionStatus", "cloudinary");
        alert("Cloudinary 설정이 저장되었습니다.");
    } catch (error) {
        console.error("Cloudinary 설정 저장 오류:", error);
        alert("Cloudinary 설정 저장 중 오류가 발생했습니다.");
    }
}

// Pixabay 설정 불러오기 및 유효성 검사
async function loadPixabaySettings() {
    const apiKeyInput = document.getElementById("pixabayApiKey");

    try {
        const userId = auth.currentUser.uid;
        const doc = await db.collection("settings").doc(userId).get();
        const data = doc.data();

        if (data?.pixabayApiKey) {
            apiKeyInput.value = data.pixabayApiKey;
            await updateStatus("pixabayConnectionStatus", "pixabay");
        }
    } catch (error) {
        console.error("Pixabay API 키 불러오기 오류:", error);
    }
}

// Pixabay 설정 저장 및 유효성 검사 업데이트
async function savePixabaySettings() {
    const apiKey = document.getElementById("pixabayApiKey").value;

    try {
        const userId = auth.currentUser.uid;
        await db.collection("settings").doc(userId).set(
            { pixabayApiKey: apiKey },
            { merge: true }
        );

        await updateStatus("pixabayConnectionStatus", "pixabay");
        alert("Pixabay API 키가 저장되었습니다.");
    } catch (error) {
        console.error("API 키 저장 오류:", error);
        alert("API 키 저장 중 오류가 발생했습니다.");
    }
}

// 쿠팡 파트너스 설정 불러오기 및 유효성 검사
async function loadCoupangSettings() {
    const apiKeyInput = document.getElementById("coupangApiKey");
    const apiSecretInput = document.getElementById("coupangApiSecret");

    try {
        const userId = auth.currentUser.uid;
        const doc = await db.collection("settings").doc(userId).get();
        const data = doc.data();

        if (data) {
            if (data.coupangApiKey) apiKeyInput.value = data.coupangApiKey;
            if (data.coupangApiSecret) apiSecretInput.value = data.coupangApiSecret;
            await updateStatus("coupangConnectionStatus", "coupang");
        }
    } catch (error) {
        console.error("쿠팡 파트너스 설정 불러오기 오류:", error);
    }
}

// 쿠팡 파트너스 설정 저장 및 유효성 검사 업데이트
async function saveCoupangSettings() {
    const apiKey = document.getElementById("coupangApiKey").value;
    const apiSecret = document.getElementById("coupangApiSecret").value;

    try {
        const userId = auth.currentUser.uid;
        await db.collection("settings").doc(userId).set(
            {
                coupangApiKey: apiKey,
                coupangApiSecret: apiSecret
            },
            { merge: true }
        );

        await updateStatus("coupangConnectionStatus", "coupang");
        alert("쿠팡 파트너스 API 키가 저장되었습니다.");
    } catch (error) {
        console.error("API 키 저장 오류:", error);
        alert("API 키 저장 중 오류가 발생했습니다.");
    }
}



// 현재 상태 화면에 등록된 블로그 갯수를 업데이트하는 함수
async function updateBlogStatusCount() {
    try {
        const userId = auth.currentUser.uid;
        const wordpressSnapshot = await db.collection("settings").doc(userId).collection("wordpress").get();
        const googleBlogSnapshot = await db.collection("settings").doc(userId).collection("googleBlog").get();

        // 워드프레스와 구글 블로그 갯수 카운트
        const wordpressCount = wordpressSnapshot.size || 0;
        const googleBlogCount = googleBlogSnapshot.size || 0;

        // 현재 상태 화면에 갯수 반영
        document.getElementById("statusWordpress").querySelector('.count').textContent = `${wordpressCount}개 등록됨`;
        document.getElementById("statusGoogleBlog").querySelector('.count').textContent = `${googleBlogCount}개 등록됨`;
    } catch (error) {
        console.error("블로그 상태 업데이트 오류:", error);
    }
}


let currentEditId = null; // 현재 편집 중인 워드프레스 ID

// WordPress 설정 저장 또는 업데이트 함수
async function saveWordpressSettings() {
    const siteUrl = document.getElementById("wpSiteUrl").value;
    const username = document.getElementById("wpUsername").value;
    const appPassword = document.getElementById("wpAppPassword").value;

    if (!siteUrl || !username || !appPassword) {
        alert("모든 필드를 입력해주세요.");
        return;
    }

    try {
        const userId = auth.currentUser.uid;
        const userRef = db.collection("settings").doc(userId);

        if (currentEditId) {
            // 편집 중인 항목이 있을 경우, 해당 항목을 업데이트
            await userRef.collection("wordpress").doc(currentEditId).update({
                siteUrl,
                username,
                appPassword
            });
            alert("워드프레스 정보가 수정되었습니다.");
            currentEditId = null; // 편집 상태 초기화
            document.querySelector(".wp-save-button").textContent = "저장";
            document.querySelector(".wp-cancel-button").style.display = "none";
        } else {
            // 새 항목을 추가할 경우
            await userRef.collection("wordpress").add({
                siteUrl,
                username,
                appPassword
            });
            alert("워드프레스가 등록되었습니다.");
        }

        // 입력 필드 초기화 및 목록 갱신
        clearWordpressInputs();
        loadWordpressSettings();
    } catch (error) {
        console.error("WordPress 정보 저장 오류:", error);
        alert("WordPress 정보 저장 중 오류가 발생했습니다.");
    }
}

// Firestore에 저장된 WordPress 설정 불러오기
async function loadWordpressSettings() {
    const userId = auth.currentUser.uid;
    const wordpressList = document.getElementById("registeredWordpressList");

    wordpressList.innerHTML = ""; // 기존 목록 초기화

    try {
        const snapshot = await db.collection("settings").doc(userId).collection("wordpress").get();
        const totalCount = snapshot.size; // 등록된 블로그 개수

        if (totalCount === 0) {
            wordpressList.innerHTML = "<p>0개의 워드프레스가 등록되었습니다.</p>";
        } else {
            snapshot.forEach((doc) => {
                const data = doc.data();
                const listItem = document.createElement("div");
                listItem.innerHTML = `
                    <span>${data.siteUrl}</span>
                    <button onclick="editWordpress('${doc.id}')">편집</button>
                    <button onclick="deleteWordpress('${doc.id}')">삭제</button>
                `;
                wordpressList.appendChild(listItem);
            });
            // 블로그 개수 표시
            const blogCountText = `<p>${totalCount}개의 워드프레스가 등록되었습니다.</p>`;
            wordpressList.insertAdjacentHTML("beforeend", blogCountText);
        }
    } catch (error) {
        console.error("WordPress 정보 불러오기 오류:", error);
    }
}


// WordPress 편집 모드 설정 함수
function editWordpress(id) {
    currentEditId = id;
    const userId = auth.currentUser.uid;

    db.collection("settings").doc(userId).collection("wordpress").doc(id).get().then((doc) => {
        const data = doc.data();
        document.getElementById("wpSiteUrl").value = data.siteUrl;
        document.getElementById("wpUsername").value = data.username;
        document.getElementById("wpAppPassword").value = data.appPassword;
        
        document.querySelector(".wp-save-button").textContent = "수정";
        document.querySelector(".wp-cancel-button").style.display = "inline";
    });
}

// WordPress 입력 필드 초기화
function clearWordpressInputs() {
    document.getElementById("wpSiteUrl").value = "";
    document.getElementById("wpUsername").value = "";
    document.getElementById("wpAppPassword").value = "";
}

// 편집 모드 취소 함수
function cancelEditWordpress() {
    clearWordpressInputs();
    currentEditId = null;
    document.querySelector(".wp-save-button").textContent = "저장";
    document.querySelector(".wp-cancel-button").style.display = "none";
}

// WordPress 삭제 함수
function deleteWordpress(id) {
    const userId = auth.currentUser.uid;

    db.collection("settings").doc(userId).collection("wordpress").doc(id).delete().then(() => {
        alert("워드프레스가 삭제되었습니다.");
        loadWordpressSettings();
    }).catch((error) => {
        console.error("WordPress 삭제 오류:", error);
        alert("삭제 중 오류가 발생했습니다.");
    });
}


let currentGoogleEditId = null; // 현재 편집 중인 구글 블로그 ID

// Google Blog 설정 저장 또는 업데이트 함수
async function saveGoogleBlogSettings() {
    const blogUrl = document.getElementById("googleBlogUrl").value;
    const blogId = document.getElementById("googleBlogId").value;
    const clientId = document.getElementById("googleClientId").value;
    const clientSecret = document.getElementById("googleClientSecret").value;
    const refreshToken = document.getElementById("googleRefreshToken").value;

    if (!blogUrl || !blogId || !clientId || !clientSecret || !refreshToken) {
        alert("모든 필드를 입력해주세요.");
        return;
    }

    try {
        const userId = auth.currentUser.uid;
        const userRef = db.collection("settings").doc(userId);

        if (currentGoogleEditId) {
            // 편집 중인 항목이 있을 경우, 해당 항목을 업데이트
            await userRef.collection("googleBlog").doc(currentGoogleEditId).update({
                blogUrl,
                blogId,
                clientId,
                clientSecret,
                refreshToken
            });
            alert("구글 블로그 정보가 수정되었습니다.");
            currentGoogleEditId = null; // 편집 상태 초기화
            document.querySelector(".google-save-button").textContent = "저장";
            document.querySelector(".google-cancel-button").style.display = "none";
        } else {
            // 새 항목을 추가할 경우
            await userRef.collection("googleBlog").add({
                blogUrl,
                blogId,
                clientId,
                clientSecret,
                refreshToken
            });
            alert("구글 블로그가 등록되었습니다.");
        }

        clearGoogleBlogInputs();
        loadGoogleBlogSettings();
    } catch (error) {
        console.error("Google Blog 정보 저장 오류:", error);
        alert("Google Blog 정보 저장 중 오류가 발생했습니다.");
    }
}

// Firestore에 저장된 Google Blog 설정 불러오기
async function loadGoogleBlogSettings() {
    const userId = auth.currentUser.uid;
    const googleBlogList = document.getElementById("registeredGoogleBlogList");

    googleBlogList.innerHTML = ""; // 기존 목록 초기화

    try {
        const snapshot = await db.collection("settings").doc(userId).collection("googleBlog").get();
        const totalCount = snapshot.size; // 등록된 블로그 개수

        if (totalCount === 0) {
            googleBlogList.innerHTML = "<p>0개의 구글 블로그가 등록되었습니다.</p>";
        } else {
            snapshot.forEach((doc) => {
                const data = doc.data();
                const listItem = document.createElement("div");
                listItem.innerHTML = `
                    <span>${data.blogUrl}</span>
                    <button onclick="editGoogleBlog('${doc.id}')">편집</button>
                    <button onclick="deleteGoogleBlog('${doc.id}')">삭제</button>
                `;
                googleBlogList.appendChild(listItem);
            });
            const blogCountText = `<p>${totalCount}개의 구글 블로그가 등록되었습니다.</p>`;
            googleBlogList.insertAdjacentHTML("beforeend", blogCountText);
        }
    } catch (error) {
        console.error("Google Blog 정보 불러오기 오류:", error);
    }
}

// Google Blog 편집 모드 설정 함수
function editGoogleBlog(id) {
    currentGoogleEditId = id;
    const userId = auth.currentUser.uid;

    db.collection("settings").doc(userId).collection("googleBlog").doc(id).get().then((doc) => {
        const data = doc.data();
        document.getElementById("googleBlogUrl").value = data.blogUrl;
        document.getElementById("googleBlogId").value = data.blogId;
        document.getElementById("googleClientId").value = data.clientId;
        document.getElementById("googleClientSecret").value = data.clientSecret;
        document.getElementById("googleRefreshToken").value = data.refreshToken;

        document.querySelector(".google-save-button").textContent = "수정";
        document.querySelector(".google-cancel-button").style.display = "inline";
    });
}

// Google Blog 입력 필드 초기화
function clearGoogleBlogInputs() {
    document.getElementById("googleBlogUrl").value = "";
    document.getElementById("googleBlogId").value = "";
    document.getElementById("googleClientId").value = "";
    document.getElementById("googleClientSecret").value = "";
    document.getElementById("googleRefreshToken").value = "";
}

// 편집 모드 취소 함수
function cancelEditGoogleBlog() {
    clearGoogleBlogInputs();
    currentGoogleEditId = null;
    document.querySelector(".google-save-button").textContent = "저장";
    document.querySelector(".google-cancel-button").style.display = "none";
}

// Google Blog 삭제 함수
function deleteGoogleBlog(id) {
    const userId = auth.currentUser.uid;

    db.collection("settings").doc(userId).collection("googleBlog").doc(id).delete().then(() => {
        alert("구글 블로그가 삭제되었습니다.");
        loadGoogleBlogSettings();
    }).catch((error) => {
        console.error("Google Blog 삭제 오류:", error);
        alert("삭제 중 오류가 발생했습니다.");
    });
}



///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
//블로그 옵션 코드





async function loadRegisteredBlogs() {
    console.log("loadRegisteredBlogs 함수가 호출되었습니다.");
    const userId = auth.currentUser?.uid;
    const blogContainer = document.getElementById("blog-container");

    if (!blogContainer) {
        console.error("blogContainer 요소를 찾을 수 없습니다.");
        return;
    }

    blogContainer.innerHTML = ""; // 기존 목록 초기화

    try {
        const wordpressSnapshot = await db.collection("settings").doc(userId).collection("wordpress").get();
        const googleBlogSnapshot = await db.collection("settings").doc(userId).collection("googleBlog").get();

        if (wordpressSnapshot.empty && googleBlogSnapshot.empty) {
            blogContainer.innerHTML = "<p>등록된 블로그가 없습니다.</p>";
        } else {
            wordpressSnapshot.forEach((doc) => {
                const data = doc.data();
                const listItem = document.createElement("div");
                listItem.classList.add("blog-item");
                listItem.innerHTML = `
                    <span>${data.siteUrl} (워드프레스)</span>
                    <label class="toggle-label">
                        <input type="radio" name="blogToggle" value="${data.siteUrl}" onchange="handleToggleChange(this)">
                        <span class="toggle-switch"></span>
                    </label>
                `;
                blogContainer.appendChild(listItem);
            });

            googleBlogSnapshot.forEach((doc) => {
                const data = doc.data();
                const listItem = document.createElement("div");
                listItem.classList.add("blog-item");
                listItem.innerHTML = `
                    <span>${data.blogUrl} (구글 블로그)</span>
                    <label class="toggle-label">
                        <input type="radio" name="blogToggle" value="${data.blogUrl}" onchange="handleToggleChange(this)">
                        <span class="toggle-switch"></span>
                    </label>
                `;
                blogContainer.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error("블로그 정보 불러오기 오류:", error);
    }
}

function handleToggleChange(selectedToggle) {
    const toggles = document.querySelectorAll("input[name='blogToggle']");
    toggles.forEach((toggle) => {
        if (toggle !== selectedToggle) {
            toggle.checked = false;
        }
    });
}


// 키워드 저장용 배열
let keywords = [];


// 토글 변경 핸들러
function handleTopicToggleChange(selectedToggle) {
    const toggles = document.querySelectorAll("input[name='topicToggle']");
    const manualTopicInput = document.getElementById("manual-topic-input");
    const rssCrawlInput = document.getElementById("rss-crawl-input");

    // 모든 입력창 초기화
    manualTopicInput.style.display = "none";
    rssCrawlInput.style.display = "none";

    // 선택한 토글 활성화
    toggles.forEach((toggle) => {
        if (toggle !== selectedToggle) {
            toggle.checked = false;
        }
    });

    // 선택된 옵션에 따라 입력창 표시
    if (selectedToggle.value === "manualTopic") {
        manualTopicInput.style.display = "block";
    } else if (selectedToggle.value === "rssCrawl") {
        rssCrawlInput.style.display = "block";
    }
}

// 키워드 추가
function addKeywords() {
    const topicInput = document.getElementById("topicInput");
    const inputKeywords = topicInput.value.split(",").map((kw) => kw.trim()).filter(Boolean);

    inputKeywords.forEach((keyword) => {
        if (!keywords.includes(keyword)) {
            keywords.push(keyword);
        }
    });

    renderKeywords();
    topicInput.value = ""; // 입력창 초기화
}

// 키워드 삭제
function deleteKeyword(index) {
    keywords.splice(index, 1);
    renderKeywords();
}

// 키워드 목록 렌더링
function renderKeywords() {
    const keywordList = document.getElementById("keywordList");
    keywordList.innerHTML = ""; // 기존 목록 초기화

    keywords.forEach((keyword, index) => {
        const li = document.createElement("li");
        li.textContent = keyword;
        li.classList.add("normal");

        // 삭제 버튼 추가
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "삭제";
        deleteBtn.onclick = (event) => {
            event.stopPropagation(); // 클릭 이벤트 방지
            deleteKeyword(index);
        };
        li.appendChild(deleteBtn);

        keywordList.appendChild(li);
    });
}



// 기본 프롬프트 내용
let defaultPrompt = `SEO에 최적화된 블로그 글 생성:\n\n
1. 키워드를 포함한 제목을 생성합니다.\n
2. 주제에 대한 상세한 소개로 시작합니다.\n
3. 각 문단마다 키워드를 적절히 포함하면서, 가독성을 유지합니다.\n
4. 사용자에게 유용한 정보와 자료를 제공하고, 관련 링크를 포함합니다.\n
5. 마무리 문단에서 요약과 결론을 제시하여 독자가 이해하기 쉽게 합니다.\n
6. 글이 자연스럽고 흥미롭게 흐르도록 서술합니다.\n
7. 최신 정보와 트렌드를 반영하여 신뢰성과 유용성을 높입니다.\n
8. 독자의 관심을 유도하기 위한 질문 또는 의견 유도 문구를 추가합니다.\n
9. SEO를 위한 메타 설명, 제목, 및 적절한 태그를 함께 생성합니다.`;


// 프롬프트 토글 변경 핸들러
function handlePromptToggleChange(toggle) {
    const savedPromptListContainer = document.getElementById("saved-prompt-list-container");
    const promptEditor = document.getElementById("prompt-editor");
    const titleInput = document.getElementById("promptTitleInput");
    const contentTextarea = document.getElementById("savedPromptContent");

    // 초기화
    savedPromptListContainer.style.display = "none";
    promptEditor.style.display = "none";
    titleInput.value = "";
    contentTextarea.value = "";

    if (toggle.value === "defaultPrompt") {
        // 기본 프롬프트 선택 처리
        contentTextarea.value = defaultPrompt; // 기본 프롬프트 내용 설정
        titleInput.disabled = true;
        contentTextarea.disabled = true;

        // 저장된 프롬프트 선택 해제
        const savedPromptRadios = document.querySelectorAll('input[name="savedPromptToggle"]');
        savedPromptRadios.forEach((radio) => {
            radio.checked = false;
        });
    } else if (toggle.value === "savedPromptParent") {
        // 사용자 프롬프트 선택 처리 (저장된 프롬프트 표시)
        savedPromptListContainer.style.display = "block";
        titleInput.disabled = false;
        contentTextarea.disabled = false;
    } else if (toggle.value.startsWith("savedPrompt")) {
        // 저장된 프롬프트 선택 처리
        handleSavedPromptSelect(toggle.value);
        savedPromptListContainer.style.display = "block"; // 부모 사용자 프롬프트 유지
        promptEditor.style.display = "block";
        titleInput.disabled = false;
        contentTextarea.disabled = false;
    }
}


// 저장된 프롬프트 불러오기
async function loadSavedPrompts() {
    const userId = auth.currentUser?.uid;
    const savedPromptList = document.getElementById("savedPromptList");
    savedPromptList.innerHTML = ""; // 기존 내용 초기화

    try {
        const snapshot = await db.collection("settings").doc(userId).collection("prompts").get();
        if (snapshot.empty) {
            savedPromptList.innerHTML = "<li>저장된 프롬프트가 없습니다.</li>";
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const listItem = document.createElement("li");
            listItem.classList.add("saved-prompt-item");

            listItem.innerHTML = `
                <div class="prompt-details">
                    <span class="prompt-title">${data.title}</span>
                </div>
                <label class="toggle-label">
                    <input type="radio" name="savedPromptToggle" value="savedPrompt-${doc.id}" onchange="handlePromptToggleChange(this)">
                    <span class="toggle-switch"></span>
                </label>
            `;

            savedPromptList.appendChild(listItem);
        });

        console.log("저장된 프롬프트를 성공적으로 불러왔습니다.");
    } catch (error) {
        console.error("프롬프트 불러오기 오류:", error);
        savedPromptList.innerHTML = "<li>프롬프트를 불러오는 중 오류가 발생했습니다.</li>";
    }
}

// 선택한 저장된 프롬프트 불러오기
async function handleSavedPromptSelect(promptId) {
    const userId = auth.currentUser?.uid;
    try {
        const docId = promptId.replace("savedPrompt-", ""); // ID 추출
        const doc = await db.collection("settings").doc(userId).collection("prompts").doc(docId).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById("promptTitleInput").value = data.title;
            document.getElementById("savedPromptContent").value = data.content;
        }
    } catch (error) {
        console.error("프롬프트 선택 오류:", error);
    }
}

// 프롬프트 목록에서 저장된 프롬프트 선택 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
    const savedPromptList = document.getElementById("savedPromptList");

    if (savedPromptList) {
        savedPromptList.addEventListener("change", (event) => {
            const selectedPromptToggle = event.target;

            // 프롬프트 토글인지 확인
            if (selectedPromptToggle.name === "promptToggle") {
                handlePromptToggleChange(selectedPromptToggle);
            }
        });
    }
});





// 프롬프트 저장
async function savePrompt() {
    const userId = auth.currentUser?.uid;
    const titleInput = document.getElementById("promptTitleInput").value.trim();
    const contentInput = document.getElementById("savedPromptContent").value.trim();

    if (!titleInput || !contentInput) {
        alert("프롬프트 제목과 내용을 입력해주세요.");
        return;
    }

    try {
        const promptsCollection = db.collection("settings").doc(userId).collection("prompts");

        // 동일한 제목의 프롬프트가 있는지 확인
        const snapshot = await promptsCollection.where("title", "==", titleInput).get();

        if (!snapshot.empty) {
            // 기존 프롬프트 업데이트
            const docId = snapshot.docs[0].id;
            await promptsCollection.doc(docId).update({
                content: contentInput,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });

            alert("프롬프트가 업데이트되었습니다.");
        } else {
            // 새로운 프롬프트 추가
            const newPrompt = {
                title: titleInput,
                content: contentInput,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            };

            const totalSnapshot = await promptsCollection.get();
            if (totalSnapshot.size >= 5) {
                alert("프롬프트는 최대 5개까지만 저장할 수 있습니다.");
                return;
            }

            await promptsCollection.add(newPrompt);
            alert("새로운 프롬프트가 저장되었습니다.");
        }

        // 목록 새로 고침
        await loadSavedPrompts();
    } catch (error) {
        console.error("프롬프트 저장 오류:", error);
        alert("프롬프트 저장 중 오류가 발생했습니다.");
    }
}


// 프롬프트 삭제
async function deletePrompt() {
    const selectedPrompt = document.querySelector('input[name="savedPromptToggle"]:checked'); // 저장된 프롬프트 토글 확인

    if (!selectedPrompt) {
        alert("삭제할 프롬프트를 선택하세요.");
        return;
    }

    // Firestore 문서 ID 추출
    const promptId = selectedPrompt.value.replace("savedPrompt-", ""); // 'savedPrompt-' 제거
    const userId = auth.currentUser?.uid;

    if (!userId) {
        alert("사용자 인증이 필요합니다.");
        return;
    }

    try {
        // Firestore에서 해당 문서 삭제
        await db.collection("settings").doc(userId).collection("prompts").doc(promptId).delete();

        alert("프롬프트가 삭제되었습니다.");

        // 목록 새로 고침
        await loadSavedPrompts();
    } catch (error) {
        console.error("프롬프트 삭제 오류:", error);
        alert("프롬프트 삭제 중 오류가 발생했습니다.");
    }
}



// 문장 형식 선택 핸들러
function selectTone(button) {
    document.querySelectorAll(".tone-button").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    const selectedTone = button.getAttribute("data-tone");
    console.log("선택된 문장 형식:", selectedTone);
}

// 언어 선택 핸들러
function selectLanguage(button) {
    document.querySelectorAll(".language-button").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    const selectedLanguage = button.getAttribute("data-language");
    console.log("선택된 언어:", selectedLanguage);
}

// 이모티콘 삽입 토글 핸들러
function toggleEmoji() {
    const emojiToggle = document.getElementById("emojiToggle").checked;
    console.log("이모티콘 삽입:", emojiToggle ? "활성화" : "비활성화");
}

// AI 토글 변경 핸들러
function handleAiToggleChange(toggle) {
    const aiOptions = document.querySelectorAll("#ai-options .ai-option");

    // 모든 옵션에서 선택 상태 제거
    aiOptions.forEach((option) => {
        option.classList.remove("selected");
    });

    // 선택된 토글의 부모 항목 강조
    if (toggle.checked) {
        toggle.closest(".ai-option").classList.add("selected");
    }
}

// 포스팅 옵션 토글 핸들러
function handlePostingOptionToggle(toggle, option, isFromSettings = false) {
    const autoPostingToggle = document.getElementById("useAutoPosting");
    const schedulePostingToggle = document.getElementById("useScheduledPosting");
    const autoPostingOptions = document.getElementById("auto-posting-options");
    const schedulePostingOptions = document.getElementById("schedule-posting-options");

    if (option === 'auto') {
        if (toggle.checked) {
            schedulePostingToggle.checked = false; // 다른 옵션 끄기
            autoPostingOptions.classList.remove("hidden");
            schedulePostingOptions.classList.add("hidden");
        } else if (!isFromSettings) {
            autoPostingOptions.classList.add("hidden"); // 끌 경우 옵션 숨기기
        }
    } else if (option === 'schedule') {
        if (toggle.checked) {
            autoPostingToggle.checked = false; // 다른 옵션 끄기
            schedulePostingOptions.classList.remove("hidden");
            autoPostingOptions.classList.add("hidden");
        } else if (!isFromSettings) {
            schedulePostingOptions.classList.add("hidden"); // 끌 경우 옵션 숨기기
        }
    }

    // 만약 `isFromSettings`가 true라면, 사용자의 직접 조작 없이 UI만 업데이트.
}



// 시간 버튼 선택
function selectPostingInterval(button) {
    // 모든 버튼의 active 클래스 제거
    document.querySelectorAll(".time-button").forEach(btn => btn.classList.remove("active"));
    document.querySelector(".custom-button").classList.remove("active");

    // 선택한 버튼에 active 클래스 추가
    button.classList.add("active");

    // 직접 입력창 비활성화
    document.getElementById("customInterval").value = "";
}

// 직접 입력 버튼 선택
function selectCustomInput() {
    // 모든 버튼의 active 클래스 제거
    document.querySelectorAll(".time-button").forEach(btn => btn.classList.remove("active"));

    // 직접 입력 버튼에 active 클래스 추가
    document.querySelector(".custom-button").classList.add("active");

    // 직접 입력창에 포커스 설정
    document.getElementById("customInterval").focus();
}

// 이미지 사용 토글
function handleImageToggle(toggle) {
    const imageOptions = document.getElementById("image-options");
    imageOptions.classList.toggle("hidden", !toggle.checked);
}

// 이미지 옵션 선택
function handleImageOptionChange(radio) {
    const searchOptions = document.getElementById("image-search-options");
    const uploadOptions = document.getElementById("image-upload-options");

    if (radio.value === "search") {
        searchOptions.classList.remove("hidden");
        uploadOptions.classList.add("hidden");
    } else if (radio.value === "upload") {
        searchOptions.classList.add("hidden");
        uploadOptions.classList.remove("hidden");
    }
}

// 이미지 업로드
function handleImageUpload(event) {
    const uploadedImages = document.getElementById("uploadedImages");

    Array.from(event.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageContainer = document.createElement("div");
            imageContainer.classList.add("image-container");

            const img = document.createElement("img");
            img.src = e.target.result;

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "X";
            deleteButton.classList.add("delete-button");
            deleteButton.onclick = () => {
                imageContainer.remove();
                if (!uploadedImages.hasChildNodes()) {
                    uploadedImages.innerHTML = "<p>선택된 이미지가 없습니다.</p>";
                }
            };

            imageContainer.appendChild(img);
            imageContainer.appendChild(deleteButton);
            uploadedImages.appendChild(imageContainer);
        };
        reader.readAsDataURL(file);
    });

    if (uploadedImages.innerHTML.includes("선택된 이미지가 없습니다.")) {
        uploadedImages.innerHTML = ""; // 기존 텍스트 제거
    }
}

// 이미지 텍스트 삽입 토글
function handleTextToggle(toggle) {
    const textInputContainer = document.getElementById("text-input-container");
    textInputContainer.classList.toggle("hidden", !toggle.checked);
}

// 광고 삽입 옵션 토글 핸들러
function handleAdsToggle(type) {
    if (type === 'coupang') {
        const coupangInput = document.getElementById("coupang-link-input");
        const coupangToggle = document.getElementById("useCoupangAds");

        // 쿠팡 파트너스 토글 상태에 따라 입력창 표시/숨김
        coupangInput.classList.toggle("hidden", !coupangToggle.checked);

        // 입력창 초기화 (선택 해제 시)
        if (!coupangToggle.checked) {
            document.getElementById("coupangLink").value = "";
        }
    }
    // 에드센스는 현재 추가 작업 없음, 토글 상태만 반영
}



// 드롭박스 선택된 설정 업데이트
function updateSelectedSetting() {
    const dropdown = document.getElementById("savedSettingsDropdown");
    const selectedValue = dropdown.value;
    console.log("Selected setting:", selectedValue);
}

// Firestore에서 설정 저장
async function saveCurrentSettings() {
    const userId = auth.currentUser?.uid;
    const settingsNameInput = document.getElementById("settingsNameInput");
    const dropdown = document.getElementById("savedSettingsDropdown");

    // 설정 이름 가져오기: 입력된 이름 또는 드롭다운에서 선택된 이름
    const settingsName = settingsNameInput.value.trim() || dropdown.value;

    if (!userId || !settingsName) {
        alert("설정을 저장할 이름을 입력하거나 선택하세요.");
        return;
    }

    try {
        // 현재 설정 데이터 가져오기
        const settingsData = getCurrentSettings();
        settingsData.keywords = keywords; // 키워드 추가
        settingsData.timestamp = firebase.firestore.FieldValue.serverTimestamp();

        // Firestore에 저장
        await db.collection("settings").doc(userId).collection("savedSettings").doc(settingsName).set(settingsData);

        console.log("저장된 설정:", settingsData);

        alert(`설정이 "${settingsName}" 이름으로 저장되었습니다.`);

        // 저장 후 목록 갱신
        loadSavedSettings();

        // 저장 후 입력 필드 초기화
        settingsNameInput.value = "";
    } catch (error) {
        console.error("설정 저장 오류:", error);
        alert("설정 저장 중 오류가 발생했습니다.");
    }
}


// Firestore에서 저장된 설정 목록 불러오기
async function loadSavedSettings() {
    const userId = auth.currentUser?.uid;
    const dropdown = document.getElementById("savedSettingsDropdown");
    dropdown.innerHTML = '<option value="" disabled selected>저장된 설정 선택</option>'; // 초기화

    if (!userId) return;

    try {
        const snapshot = await db.collection("settings").doc(userId).collection("savedSettings").get();
        snapshot.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.id;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error("저장된 설정 목록 불러오기 오류:", error);
    }
}

// Firestore에서 선택된 설정 적용
async function applySelectedSetting() {
    const dropdown = document.getElementById("savedSettingsDropdown");
    const selectedValue = dropdown.value;

    if (!selectedValue) {
        alert("적용할 설정을 선택하세요.");
        return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
        // Firestore에서 설정 가져오기
        const docRef = db.collection("settings").doc(userId).collection("savedSettings").doc(selectedValue);
        const doc = await docRef.get();

        if (doc.exists) {
            // 설정 데이터를 적용
            const settingsData = doc.data();
            setCurrentSettings(settingsData);

            // 키워드 적용
            keywords = settingsData.keywords || [];
            renderKeywords();

            // `timestamp` 업데이트
            await docRef.update({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });

        } else {
            alert("설정을 찾을 수 없습니다.");
        }
    } catch (error) {
        console.error("설정 적용 오류:", error);
    }
}


// Firestore에서 설정 삭제
async function deleteSelectedSetting() {
    const dropdown = document.getElementById("savedSettingsDropdown");
    const selectedValue = dropdown.value;

    if (!selectedValue) {
        alert("삭제할 설정을 선택하세요.");
        return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    if (confirm("선택된 설정을 삭제하시겠습니까?")) {
        try {
            await db.collection("settings").doc(userId).collection("savedSettings").doc(selectedValue).delete();
            loadSavedSettings();
        } catch (error) {
            console.error("설정 삭제 오류:", error);
        }
    }
}

// 페이지 로드 시 마지막 저장된 또는 적용된 설정 불러오기
async function loadLastAppliedSettings() {
    const userId = auth.currentUser?.uid;

    if (!userId) {
        console.error("사용자 ID가 없습니다.");
        return;
    }

    try {
        const snapshot = await db
            .collection("settings")
            .doc(userId)
            .collection("savedSettings")
            .orderBy("timestamp", "desc") // 최신순으로 정렬
            .limit(1) // 가장 최근 항목 1개만 가져오기
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const settingsData = doc.data();

            // 불러온 설정을 UI에 적용
            setCurrentSettings(settingsData);

            console.log("마지막 설정이 적용되었습니다:", doc.id);

            // 드롭다운에 선택 표시
            const dropdown = document.getElementById("savedSettingsDropdown");
            if (dropdown) {
                dropdown.value = doc.id;
            }
        } else {
            console.log("적용할 설정이 없습니다.");
        }
    } catch (error) {
        console.error("마지막 설정 불러오기 오류:", error);
    }
}




// 현재 설정 데이터 가져오기
function getCurrentSettings() {
    
    const parentSelection = document.querySelector('input[name="promptToggle"]:checked')?.value || "defaultPrompt";
    const savedPromptSelection = document.querySelector('input[name="savedPromptToggle"]:checked')?.value || null;
    const title = document.getElementById("promptTitleInput").value.trim();
    const content = document.getElementById("savedPromptContent").value.trim();

    const useImage = document.getElementById("useImageToggle")?.checked || false;
    const imageOption = document.querySelector('input[name="imageOption"]:checked')?.value || null;
    const uploadedImages = Array.from(document.querySelectorAll("#uploadedImages img")).map(img => img.src);
    const insertTextToggle = document.getElementById("insertTextToggle")?.checked || false;
    const insertedText = document.getElementById("imageTextInput")?.value || "";

    const activeTimeButton = document.querySelector(".time-button.active")?.dataset.time || null;
    const customInterval = document.getElementById("customInterval")?.value || "";
    const timeButtonType = activeTimeButton ? "button" : customInterval ? "custom" : null;

    return {
        blogSelection: document.querySelector('input[name="blogToggle"]:checked')?.value || null,
        topicSelection: document.querySelector('input[name="topicToggle"]:checked')?.value || null,
        manualTopic: document.getElementById("topicInput")?.value || "",
        rssInput: document.getElementById("rssInput")?.value || "",
        parentSelection,
        savedPromptSelection,
        title,
        content,
        keywords, // 현재 키워드 포함
        language: document.querySelector('.language-button.selected')?.dataset.language || null,
        tone: document.querySelector('.tone-button.selected')?.dataset.tone || null,
        emojiToggle: document.getElementById("emojiToggle")?.checked || false,
        useImage,
        imageOption,
        uploadedImages,
        showImageSource: document.getElementById("showImageSourceToggle")?.checked || false,
        insertTextToggle,
        insertedText,
        useCoupangAds: document.getElementById("useCoupangAds")?.checked || false,
        coupangLink: document.getElementById("coupangLink")?.value || "",
        useAdSenseAds: document.getElementById("useAdSenseAds")?.checked || false,
        aiSelection: document.querySelector('input[name="aiToggle"]:checked')?.value || null,
        postingOption: {
            auto: document.getElementById("useAutoPosting")?.checked || false,
            schedule: document.getElementById("useScheduledPosting")?.checked || false,
        },
        timeButton: activeTimeButton,
        timeButtonType,
        customInterval,
        schedule: {
            year: document.getElementById("scheduleYear")?.value || "",
            month: document.getElementById("scheduleMonth")?.value || "",
            day: document.getElementById("scheduleDay")?.value || "",
            hour: document.getElementById("scheduleHour")?.value || "",
            minute: document.getElementById("scheduleMinute")?.value || "",
        },
    };
}



// 저장된 설정을 페이지에 적용
function setCurrentSettings(settingsData) {
    // 프롬프트 설정
    const parentSelection = settingsData.parentSelection || "defaultPrompt";
    const savedPromptSelection = settingsData.savedPromptSelection || null;

    // 부모 선택 상태 복원
    const parentRadio = document.querySelector(`input[name="promptToggle"][value="${parentSelection}"]`);
    if (parentRadio) {
        parentRadio.checked = true;
        handlePromptToggleChange(parentRadio); // 부모 상태 적용
    }

    // 저장된 프롬프트 선택 상태 복원
    if (savedPromptSelection) {
        const savedPromptRadio = document.querySelector(`input[name="savedPromptToggle"][value="${savedPromptSelection}"]`);
        if (savedPromptRadio) {
            savedPromptRadio.checked = true;
            handlePromptToggleChange(savedPromptRadio);
        }
    }

    // 에디터 값 복원
    if (settingsData.title && settingsData.content) {
        document.getElementById("promptTitleInput").value = settingsData.title;
        document.getElementById("savedPromptContent").value = settingsData.content;
    }

    // 키워드 복원
    keywords = settingsData.keywords || [];
    renderKeywords();

    // 블로그 및 주제 관련 설정
    document.querySelector(`input[name="blogToggle"][value="${settingsData.blogSelection}"]`)?.click();
    document.querySelector(`input[name="topicToggle"][value="${settingsData.topicSelection}"]`)?.click();
    document.getElementById("topicInput").value = settingsData.manualTopic || "";
    document.getElementById("rssInput").value = settingsData.rssInput || "";

    // 스타일 설정
    document.querySelector(`.language-button[data-language="${settingsData.language}"]`)?.click();
    document.querySelector(`.tone-button[data-tone="${settingsData.tone}"]`)?.click();
    document.getElementById("emojiToggle").checked = settingsData.emojiToggle;

    // 이미지 사용 여부 설정
    const useImageToggle = document.getElementById("useImageToggle");
    useImageToggle.checked = settingsData.useImage || false;
    handleImageToggle(useImageToggle); // 하위 옵션 업데이트

    // 이미지 옵션 설정
    document.querySelector(`input[name="imageOption"][value="${settingsData.imageOption}"]`)?.click();
    const uploadedImagesContainer = document.getElementById("uploadedImages");
    uploadedImagesContainer.innerHTML = settingsData.uploadedImages
        .map(src => `<div class="image-container"><img src="${src}" alt="Uploaded Image"><button class="delete-button" onclick="this.parentElement.remove()">X</button></div>`)
        .join("");
    document.getElementById("showImageSourceToggle").checked = settingsData.showImageSource;
    document.getElementById("insertTextToggle").checked = settingsData.insertTextToggle;
    handleTextToggle(document.getElementById("insertTextToggle")); // 텍스트 삽입 토글 처리
    document.getElementById("imageTextInput").value = settingsData.insertedText || "";

    // 쿠팡 파트너스 광고 설정
    const useCoupangAdsToggle = document.getElementById("useCoupangAds");
    useCoupangAdsToggle.checked = settingsData.useCoupangAds || false;
    handleAdsToggle('coupang'); // 하위 입력 필드 표시/숨김 처리
    document.getElementById("coupangLink").value = settingsData.coupangLink || "";

    // 에드센스 광고 설정
    document.getElementById("useAdSenseAds").checked = settingsData.useAdSenseAds || false;

    // AI 옵션 설정
    document.querySelector(`input[name="aiToggle"][value="${settingsData.aiSelection}"]`)?.click();

    // 포스팅 옵션
    document.getElementById("useAutoPosting").checked = settingsData.postingOption.auto;
    document.getElementById("useScheduledPosting").checked = settingsData.postingOption.schedule;

    // 포스팅 옵션
    handlePostingOptionToggle(
        { checked: settingsData.postingOption.auto },
        'auto',
        true
    );
    handlePostingOptionToggle(
        { checked: settingsData.postingOption.schedule },
        'schedule',
        true
    );

    // 시간 버튼 및 직접 입력 복원
    if (settingsData.timeButtonType === "button") {
        document.querySelector(`.time-button[data-time="${settingsData.timeButton}"]`)?.classList.add("active");
    } else if (settingsData.timeButtonType === "custom") {
        document.getElementById("customInterval").value = settingsData.customInterval || "";
        document.querySelector(".custom-button")?.classList.add("active");
    }

    // 예약 일정
    document.getElementById("scheduleYear").value = settingsData.schedule?.year || "";
    document.getElementById("scheduleMonth").value = settingsData.schedule?.month || "";
    document.getElementById("scheduleDay").value = settingsData.schedule?.day || "";
    document.getElementById("scheduleHour").value = settingsData.schedule?.hour || "";
    document.getElementById("scheduleMinute").value = settingsData.schedule?.minute || "";
}

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
//블로그 생성 코드


async function generatePost() {
    const settings = getCurrentSettings();

    if (!settings.blogSelection) {
        alert("블로그를 선택하세요.");
        return;
    }

    if (!settings.topicSelection) {
        alert("주제 선택이 필요합니다.");
        return;
    }

    try {
        const response = await fetch('https://www.dokdolove.com/api/generate-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: auth.currentUser?.uid, // 사용자 ID
                settings,
                keywords: settings.keywords || [], // 키워드 목록
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '응답 처리 실패' }));
            throw new Error(errorData.error || '작업 처리 실패');
        }

        const result = await response.json();
        console.log('작업 생성 성공:', result);
        alert('포스팅 작업이 시작되었습니다.');
    } catch (error) {
        console.error('생성 작업 오류:', error);
        alert('작업 생성 중 오류가 발생했습니다.');
    }
}





///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
//나의 문서 코드


async function loadPostHistory(userId) {
    try {
        const historyRef = db.collection("postHistory").doc(userId).collection("posts").orderBy("timestamp", "desc");
        const snapshot = await historyRef.get();

        const historyContainer = document.getElementById("postHistoryContainer");
        historyContainer.innerHTML = ""; // 기존 내용 초기화

        snapshot.forEach((doc) => {
            const data = doc.data();
            const postElement = document.createElement("div");
            postElement.classList.add("post-item");

            postElement.innerHTML = `
                <h3>${data.title}</h3>
                <p>${data.content.substring(0, 100)}...</p>
                <small>${new Date(data.timestamp.seconds * 1000).toLocaleString()}</small>
                <button onclick="editPost('${doc.id}')">수정</button>
                <button onclick="deletePost('${doc.id}')">삭제</button>
                <span class="status">${data.status || "포스팅 완료"}</span>
            `;
            historyContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error("포스팅 내역 로드 중 오류:", error);
    }
}

// 포스팅 수정
async function editPost(postId) {
    const newContent = prompt("수정할 내용을 입력하세요:");
    if (newContent !== null) {
        await db.collection("postHistory").doc(userId).collection("posts").doc(postId).update({
            content: newContent,
        });
        alert("포스팅 내용이 수정되었습니다.");
        loadPostHistory(userId);
    }
}

// 포스팅 삭제
async function deletePost(postId) {
    await db.collection("postHistory").doc(userId).collection("posts").doc(postId).delete();
    alert("포스팅이 삭제되었습니다.");
    loadPostHistory(userId);
}


///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
//가이드 코드



// 사이드바 항목 클릭 시 선택 상태 표시
document.querySelectorAll('.guide-sidebar a').forEach(link => {
    link.addEventListener('click', function () {
        document.querySelectorAll('.guide-sidebar a').forEach(el => el.classList.remove('selected'));
        this.classList.add('selected');
    });
});

// 모바일에서 사이드바를 열고 닫는 함수
function toggleSidebar() {
    const sidebar = document.querySelector('.guide-sidebar');
    const overlay = document.querySelector('.guide-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
}

// 모바일 화면에서 외부 클릭 시 사이드바 닫기
function closeSidebar() {
    const sidebar = document.querySelector('.guide-sidebar');
    const overlay = document.querySelector('.guide-overlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
}

// 가이드 페이지 초기화 함수
function initGuidePage() {
    // 사이드바 항목 클릭 이벤트 설정
    document.querySelectorAll(".guide-sidebar a").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            // 가장 가까운 <a> 태그에서 contentType 추출
            const anchor = event.target.closest("a");
            if (!anchor) return; // <a> 태그가 아닌 경우 종료

            const onclickContent = anchor.getAttribute("onclick");
            if (!onclickContent) return; // `onclick` 속성이 없으면 종료

            const match = onclickContent.match(/loadGuideContent\('(\w+)'\)/);
            if (!match) return; // 정규식에 매칭되지 않으면 종료

            const contentType = match[1]; // 정규식 그룹 1 추출
            loadGuideContent(contentType); // 가이드 콘텐츠 로드

            // 모바일 화면에서 항목 클릭 시 사이드바 닫기
            if (window.innerWidth <= 768) {
                closeSidebar(); // 사이드바 닫기
            }
        });
    });

    // 외부 클릭 시 사이드바 닫기
    const overlay = document.querySelector('.guide-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
}


// 사이드바 하이라이트 및 콘텐츠 업데이트 함수
function updateGuidebarHighlight(contentType) {
    const sidebarLinks = document.querySelectorAll(".guide-sidebar a");

    sidebarLinks.forEach(link => {
        const onclickContent = link.getAttribute("onclick");
        if (onclickContent === `loadGuideContent('${contentType}')`) {
            link.classList.add("selected");
        } else {
            link.classList.remove("selected");
        }
    });
}



function loadGuideContent(contentType) {
    const guideContent = document.getElementById("guideContent");
    if (!guideContent) return;

    // 현재 표시된 내용을 저장하고 중복 호출 방지
    if (guideContent.dataset.currentContent === contentType) return;
    guideContent.dataset.currentContent = contentType;
    updateGuidebarHighlight(contentType);

    // 콘텐츠 업데이트
    const contentData = guideData[contentType] || guideData["default"];
    guideContent.innerHTML = `
        <p>${contentData.content}</p>
    `;
}


function openGuidePopup(contentType) {
    const popupGuideContent = document.getElementById("popupGuideContent");
    const contentData = guideData[contentType] || guideData["default"];

    popupGuideContent.innerHTML = `
        <div style="padding: 20px; font-size: 1.2em; line-height: 1.8em; text-align: left;">
            ${contentData.content}
        </div>
    `;
    const popup = document.getElementById("guidePopup");
    popup.style.display = "flex";

    // 키보드 ESC 키로 팝업 닫기 이벤트 추가
    document.addEventListener("keydown", closePopupOnEsc);
}

function closeGuidePopup() {
    const popup = document.getElementById("guidePopup");
    popup.style.display = "none";

    // ESC 이벤트 제거
    document.removeEventListener("keydown", closePopupOnEsc);
}

function closePopupOnEsc(event) {
    if (event.key === "Escape") {
        closeGuidePopup();
    }
}



const guideData = {
    "api-overview": {
        content: `
            <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">API란?</h3>
            <p style="font-size: 1.2em; line-height: 1.8em; text-align: left;">
                API는 <strong>Application Programming Interface</strong>의 약자로, 
                서로 다른 프로그램이나 시스템 간에 <strong>데이터 교환</strong>과 
                <strong>기능 수행</strong>을 가능하게 하는 인터페이스입니다. 
                즉, <em>프로그램 간의 커뮤니케이션을 위한 규칙</em>이라고 할 수 있습니다.
            </p>
            <br>
            <p style="font-size: 1.2em; line-height: 1.8em; text-align: left;">
                우리가 일상적으로 사용하는 앱이나 웹사이트에서도 API는 필수적인 역할을 합니다. 
                예를 들어, 날씨 정보를 보여주는 앱은 기상청의 데이터 API를 이용해 현재 날씨 정보를 가져옵니다.
            </p>
            <br><br>
            <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">API의 주요 구성 요소</h3>
            <ul style="font-size: 1.2em; line-height: 1.8em; text-align: left; margin-left: 20px;">
                <li><strong>요청(Request):</strong> 클라이언트(사용자)가 서버에게 데이터를 요청합니다.</li>
                <li><strong>응답(Response):</strong> 서버는 클라이언트의 요청에 대해 데이터를 반환합니다.</li>
                <li><strong>엔드포인트(Endpoint):</strong> API가 동작하는 URL입니다. 예: <code>https://api.example.com/users</code></li>
                <li><strong>메서드(Method):</strong> 요청의 유형을 정의합니다. (GET, POST, PUT, DELETE 등)</li>
            </ul>
            <br><br>
            
            <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">API의 장점</h3>
            <ul style="font-size: 1.2em; line-height: 1.8em; text-align: left; margin-left: 20px;">
                <li>복잡한 시스템의 기능을 쉽게 사용할 수 있습니다.</li>
                <li>데이터 및 서비스를 통합하고 확장성을 제공합니다.</li>
                <li>시간과 비용을 절약할 수 있습니다.</li>
            </ul>
            <br><br>
            <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">API의 종류</h3>
            <p style="font-size: 1.2em; line-height: 1.8em; text-align: left;">
                API는 크게 <strong>REST API</strong>, <strong>GraphQL</strong>, <strong>SOAP</strong> 등의 형태로 구분됩니다. 
                이 중 REST API는 가장 많이 사용되는 방식으로, HTTP를 기반으로 데이터를 주고받습니다.
            </p>
            <p style="font-size: 1.2em; line-height: 1.8em; text-align: left;">
                API는 웹 개발뿐 아니라 앱 개발, 데이터 분석, IoT 등 다양한 분야에서 활용됩니다.
            </p>
        `
    },
    "openai": {
    content: `
        <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">OpenAI API 키 발급</h3>
        <p style="font-size: 1.2em; line-height: 1.8em; text-align: left;">
            OpenAI API 키는 OpenAI 서비스를 이용하기 위해 필요한 고유 인증 코드입니다. 
            이 키를 통해 ChatGPT와 같은 AI 모델을 사용할 수 있습니다. 
            아래는 API 키를 발급받는 과정을 단계별로 설명합니다.
        </p>
        <br><br>

        <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">API 키 발급 절차</h3>
        <ol style="font-size: 1.2em; line-height: 1.8em; text-align: left; margin-left: 20px;">
            <li style="margin-bottom: 10px;">
                <strong>OpenAI 계정 생성:</strong> 
                <p>OpenAI API를 사용하려면 먼저 OpenAI 계정이 필요합니다. 아래 링크를 클릭하여 계정을 생성하세요.</p>
                <a href="https://platform.openai.com/signup/" target="_blank" style="color: #007bff;">OpenAI 계정 생성하기</a>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>로그인:</strong>
                <p>계정을 생성한 후 <a href="https://platform.openai.com/" target="_blank" style="color: #007bff;">OpenAI 플랫폼</a>에 로그인합니다.</p>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>API 키 관리 페이지 이동:</strong>
                <p>
                    로그인 후 화면 오른쪽 상단의 프로필 아이콘을 클릭하고 <strong>"View API keys"</strong>를 선택합니다. 
                    이 메뉴에서 API 키를 발급받을 수 있습니다.
                </p>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>새 API 키 생성:</strong>
                <p>
                    "Create new secret key" 버튼을 클릭하여 새로운 API 키를 생성합니다. 생성된 키를 복사하여 저장하세요. 
                    이 키는 보안상 한 번만 표시되므로 안전한 곳에 보관해야 합니다.
                </p>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>테스트 및 설정:</strong>
                <p>
                    API 키를 발급받은 후 Postman 또는 OpenAI의 제공하는 예제를 통해 키가 정상적으로 작동하는지 테스트해보세요. 
                    설정 과정에서 키를 사용하여 OpenAI 서비스를 이용할 수 있습니다.
                </p>
            </li>
        </ol>
        <br><br>

        <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">API 키 관리 시 주의사항</h3>
        <ul style="font-size: 1.2em; line-height: 1.8em; text-align: left; margin-left: 20px;">
            <li style="margin-bottom: 10px;">API 키는 <strong>비공개</strong>로 유지해야 합니다. 다른 사람과 공유하지 마세요.</li>
            <li style="margin-bottom: 10px;">키가 유출되거나 문제가 발생한 경우, 즉시 해당 키를 삭제하고 새 키를 생성하세요.</li>
            <li style="margin-bottom: 10px;">API 키는 사용량에 따라 요금이 부과될 수 있으므로, 사용량을 정기적으로 확인하세요.</li>
        </ul>
        <br><br>

        <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">추가 도움말</h3>
        <p style="font-size: 1.2em; line-height: 1.8em; text-align: left;">
            OpenAI API 키 발급과 관련하여 더 자세한 정보를 원하시면 
            <a href="https://platform.openai.com/docs/" target="_blank" style="color: #007bff;">공식 문서</a>를 참조하세요.
        </p>
        <br>
        <div style="text-align: center; margin: 30px 0;">
            <img src="https://via.placeholder.com/800x400" alt="OpenAI API 키 발급 예제" 
                 style="max-width: 80%; height: auto; border: 1px solid #ccc; border-radius: 8px;">
            <p style="font-size: 0.9em; color: #555; margin-top: 10px;">OpenAI API 키 발급 과정 스크린샷 예제</p>
        </div>
    `
}
,
    "gemini": {
        content: "Gemini API 키는 Gemini 계정을 통해 발급받을 수 있습니다. 키 발급 과정은 다음과 같습니다..."
    },

    "wordpress-create": {
    content: `
        <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">워드프레스 블로그 생성</h3>
        <p style="font-size: 1.2em; line-height: 1.8em; text-align: left;">
            워드프레스는 가장 널리 사용되는 블로그 및 웹사이트 플랫폼 중 하나입니다. 
            아래는 워드프레스 블로그를 처음부터 생성하는 과정을 단계별로 안내합니다.
        </p>
        <br><br>

        <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">워드프레스 블로그 생성 과정</h3>
        <ol style="font-size: 1.2em; line-height: 1.8em; text-align: left; margin-left: 20px;">
            <li style="margin-bottom: 10px;">
                <strong>호스팅 서비스 선택:</strong>
                <p>
                    워드프레스를 설치하려면 먼저 웹 호스팅 서비스가 필요합니다. 
                    추천 서비스: <a href="https://www.bluehost.com/" target="_blank" style="color: #007bff;">Bluehost</a>, 
                    <a href="https://www.siteground.com/" target="_blank" style="color: #007bff;">SiteGround</a>, 
                    <a href="https://wordpress.com/" target="_blank" style="color: #007bff;">WordPress.com</a>
                </p>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>도메인 이름 등록:</strong>
                <p>
                    블로그에 사용할 도메인 이름(예: <code>example.com</code>)을 등록합니다. 
                    대부분의 호스팅 서비스에서 도메인 등록을 함께 제공하며, 
                    <a href="https://www.namecheap.com/" target="_blank" style="color: #007bff;">Namecheap</a> 같은 독립적인 도메인 등록 업체를 사용할 수도 있습니다.
                </p>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>워드프레스 설치:</strong>
                <p>
                    호스팅 서비스에 따라 워드프레스를 쉽게 설치할 수 있는 "원클릭 설치" 기능이 제공됩니다. 
                    설치 옵션을 선택하고 지시에 따라 워드프레스를 설치합니다.
                </p>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>관리자 계정 설정:</strong>
                <p>
                    설치 중 블로그 관리에 사용할 관리자 계정 정보를 설정합니다. 
                    <strong>사용자 이름</strong>과 <strong>강력한 비밀번호</strong>를 설정하는 것이 중요합니다.
                </p>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>기본 설정 및 테마 선택:</strong>
                <p>
                    워드프레스 설치 후 대시보드에 로그인하여 기본 설정을 완료합니다. 
                    원하는 테마를 선택하거나 사용자 지정 테마를 업로드하여 블로그의 외형을 설정합니다.
                </p>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>플러그인 설치:</strong>
                <p>
                    블로그의 기능을 확장하기 위해 필요한 플러그인을 설치합니다. 
                    예: SEO 최적화를 위한 <a href="https://yoast.com/" target="_blank" style="color: #007bff;">Yoast SEO</a>, 
                    보안을 위한 <a href="https://wordfence.com/" target="_blank" style="color: #007bff;">Wordfence</a>.
                </p>
            </li>
            <li style="margin-bottom: 10px;">
                <strong>블로그 게시물 작성:</strong>
                <p>
                    설정이 완료되면 첫 번째 블로그 게시물을 작성하고 게시하세요. 
                    "포스트" 메뉴를 통해 새 게시물을 추가할 수 있습니다.
                </p>
            </li>
        </ol>
        <br><br>

        <h3 style="font-size: 2em; margin-bottom: 15px; text-align: left;">추가 참고 자료</h3>
        <p style="font-size: 1.2em; line-height: 1.8em; text-align: left;">
            워드프레스에 대한 자세한 정보는 <a href="https://wordpress.org/" target="_blank" style="color: #007bff;">WordPress.org</a> 공식 사이트를 참고하세요.
        </p>
        <br>
        <div style="text-align: center; margin: 30px 0;">
            <img src="https://via.placeholder.com/800x400" alt="워드프레스 설치 예제" 
                 style="max-width: 80%; height: auto; border: 1px solid #ccc; border-radius: 8px;">
            <p style="font-size: 0.9em; color: #555; margin-top: 10px;">워드프레스 설치 과정 스크린샷 예제</p>
        </div>
    `
},

    "default": {
        content: "가이드 초기화면입니다."
    }
};



///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
//어시스트 코드

let currentStep = 0;

const assistSteps = [
    { id: 'wordpress', label: '워드프레스 등록', action: loadWordpressStep },
    { id: 'google', label: '구글 블로그 등록', action: loadGoogleStep },
    { id: 'openai', label: 'OpenAI API 등록', action: loadOpenAiStep },
    { id: 'gemini', label: 'Gemini API 등록', action: loadGeminiStep },
    { id: 'googleImage', label: 'Google Image API 등록', action: loadGoogleImageStep },
    { id: 'cloudinary', label: 'Cloudinary API 등록', action: loadCloudinaryStep },
    { id: 'pixabay', label: 'Pixabay API 등록', action: loadPixabayStep },
    { id: 'coupang', label: '쿠팡 파트너스 API 등록', action: loadCoupangStep },
    { id: 'settings', label: '작업 설정', action: loadWorkSettingsStep },
    { id: 'finish', label: '설정 저장 및 생성', action: loadFinishStep },
];


// 어시스트 화면 로드 함수
function startAssistDirectly() {
    const loggedIn = localStorage.getItem("loggedIn") === "true"; // 로그인 여부 확인
    if (loggedIn) {
        loadWordpressStep(); // 워드프레스 설정 화면 바로 로드
    } else {
        // 로그인 상태가 아니면 경고 표시
        alert("로그인이 필요합니다. 로그인 후 어시스트 기능을 이용하세요.");
    }
}



function startAssist() {
    currentStep = 0;
    loadStep(currentStep);
}

function loadStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= assistSteps.length) return;
    const step = assistSteps[stepIndex];
    step.action();
}

function nextStep() {
    currentStep++;
    loadStep(currentStep);
}

function prevStep() {
    // 현재 화면이 첫 번째 화면(WordPress 설정)인지 확인
    const assistContainer = document.getElementById("content");
    const currentTitle = assistContainer.querySelector("h2")?.innerText;

    if (currentTitle === "워드프레스 등록") {
        // 메인 화면으로 이동
        router("/");
    } else {
        currentStep--;
    loadStep(currentStep);
    }
}


function skipStep() {
    nextStep();
}

function loadWordpressStep() {
    const assistContainer = document.getElementById("content");

    assistContainer.innerHTML = `
        <div class="settings-container">
            <div class="settings-content">
                <h2>워드프레스 등록</h2>
                <br><br>
                <div class="wordpress-settings">
                    <div class="label-with-link">
                        <label class="wp-label" style="margin-right: 10px;">사이트 주소:</label>
                        <a class="guide-popup-link" href="#" onclick="event.preventDefault(); openGuidePopup('wordpress-create');">가이드 보기</a>
                    </div>
                    <input type="text" id="wpSiteUrl" class="wp-input" placeholder="사이트 주소 입력">
                    <label class="wp-label">사용자 이름:</label>
                    <input type="text" id="wpUsername" class="wp-input" placeholder="사용자 이름 입력">
                    <label class="wp-label">응용 프로그램 비밀번호:</label>
                    <input type="password" id="wpAppPassword" class="wp-input" placeholder="응용 프로그램 비밀번호 입력">
                    <button class="wp-save-button" onclick="saveWordpressSettings()">저장</button>
                </div>
                <h3>등록된 워드프레스</h3>
                <div id="registeredWordpressList"></div>
                <div class="step-buttons">
                    <button onclick="prevStep()">이전</button>
                    <button onclick="skipStep()">건너뛰기</button>
                    <button onclick="nextStep()">다음</button>
                </div>
            </div>
        </div>
    `;
    setTimeout(loadWordpressSettings, 0);
}











function loadGoogleStep() {
    const assistContainer = document.getElementById("content");
    assistContainer.innerHTML = `
        <div class="settings-container">
            <div class="settings-content">
            <h2>구글 블로그 등록</h2>
            <p>구글 블로그를 등록하여 다음 단계로 진행하세요.</p>
            <div class="google-settings">
                <label class="google-label">블로그 주소:</label>
                <input type="text" id="googleBlogUrl" class="google-input" placeholder="블로그 주소 입력">
                
                <label class="google-label">블로그 ID:</label>
                <input type="text" id="googleBlogId" class="google-input" placeholder="블로그 ID 입력">
                
                <label class="google-label">클라이언트 ID:</label>
                <input type="text" id="googleClientId" class="google-input" placeholder="클라이언트 ID 입력">
                
                <label class="google-label">클라이언트 시크릿:</label>
                <input type="password" id="googleClientSecret" class="google-input" placeholder="클라이언트 시크릿 입력">
                
                <label class="google-label">리프레시 토큰:</label>
                <input type="text" id="googleRefreshToken" class="google-input" placeholder="리프레시 토큰 입력">
                
                <button class="google-save-button" onclick="saveGoogleBlogSettings()">저장</button>
            </div>

            <h3>등록된 구글 블로그</h3>
            <div id="registeredGoogleBlogList"></div>
            
            <div class="step-buttons">
                <button onclick="prevStep()">이전</button>
                <button onclick="skipStep()">건너뛰기</button>
                <button onclick="nextStep()">다음</button>
            </div>
        </div>
        </div>
    `;

    // DOM 렌더링 후 구글 블로그 설정 로드
    setTimeout(loadGoogleBlogSettings, 0);
}



function loadOpenAiStep() {
    const assistContainer = document.getElementById("content");
    assistContainer.innerHTML = `
        <div class="settings-container">
            <div class="settings-content">
            <h2>OpenAI API 등록</h2>
            <p>OpenAI API 키를 입력하여 다음 단계로 진행하세요.</p>
            <div class="api-settings">
                <label class="api-label">API 키:</label>
                <input type="text" id="openaiApiKey" class="api-input" placeholder="OpenAI API 키 입력">
                <button class="api-save-button" onclick="saveOpenAiSettings()">저장</button>
            </div>

            <h3>연결 상태</h3>
            <span id="openaiConnectionStatus" class="status disconnected">연결 안됨</span>
            
            <div class="step-buttons">
                <button onclick="prevStep()">이전</button>
                <button onclick="skipStep()">건너뛰기</button>
                <button onclick="nextStep()">다음</button>
            </div>
        </div>
        </div>
    `;

    // DOM 렌더링 후 OpenAI 설정 로드
    setTimeout(loadOpenAiSettings, 0);
}



function loadGeminiStep() {
    const assistContainer = document.getElementById("content");
    assistContainer.innerHTML = `
        <div class="settings-container">
            <div class="settings-content">
            <h2>Gemini API 등록</h2>
            <p>Gemini API 키를 입력하여 다음 단계로 진행하세요.</p>
            <div class="api-settings">
                <label class="api-label">API 키:</label>
                <input type="text" id="geminiApiKey" class="api-input" placeholder="Gemini API 키 입력">
                <button class="api-save-button" onclick="saveGeminiSettings()">저장</button>
            </div>

            <h3>연결 상태</h3>
            <span id="geminiConnectionStatus" class="status disconnected">연결 안됨</span>
            
            <div class="step-buttons">
                <button onclick="prevStep()">이전</button>
                <button onclick="skipStep()">건너뛰기</button>
                <button onclick="nextStep()">다음</button>
            </div>
        </div>
        </div>
    `;

    // DOM 렌더링 후 Gemini 설정 로드
    setTimeout(loadGeminiSettings, 0);
}



function loadGoogleImageStep() {
    const assistContainer = document.getElementById("content");
    assistContainer.innerHTML = `
        <div class="settings-container">
            <div class="settings-content">
                <h2>Google 이미지 API 등록</h2>
                <p>Google 이미지 API를 등록하여 이미지 검색 기능을 사용할 수 있습니다.</p>
                <div class="api-settings">
                    <label class="api-label">API 키:</label>
                    <input type="text" id="googleImageApiKey" class="api-input" placeholder="Google 이미지 API 키 입력">
                </div>
                <div class="api-settings">
                    <label class="api-label">검색 엔진 ID (CX):</label>
                    <input type="text" id="googleImageCx" class="api-input" placeholder="검색 엔진 ID (CX) 입력">
                    <button class="api-save-button" onclick="saveGoogleImageSettings()">저장</button>
                </div>

                <h3>연결 상태</h3>
                <span id="googleImageConnectionStatus" class="status disconnected">연결 안됨</span>
                
                <div class="step-buttons">
                    <button onclick="prevStep()">이전</button>
                    <button onclick="skipStep()">건너뛰기</button>
                    <button onclick="nextStep()">다음</button>
                </div>
            </div>
        </div>
    `;

    setTimeout(loadGoogleImageSettings, 0);
}




function loadCloudinaryStep() {
    const assistContainer = document.getElementById("content");
    assistContainer.innerHTML = `
        <div class="settings-container">
            <div class="settings-content">
                <h2>Cloudinary API 등록</h2>
                <p>Cloudinary API를 등록하여 이미지 업로드 기능을 사용할 수 있습니다.</p>
                <div class="api-settings">
                    <label class="api-label">클라우드 이름:</label>
                    <input type="text" id="cloudinaryCloudName" class="api-input" placeholder="클라우드 이름 입력">
                </div>
                <div class="api-settings">
                    <label class="api-label">API 키:</label>
                    <input type="text" id="cloudinaryApiKey" class="api-input" placeholder="API 키 입력">
                </div>
                <div class="api-settings">
                    <label class="api-label">API 비밀:</label>
                    <input type="password" id="cloudinaryApiSecret" class="api-input" placeholder="API 비밀 입력">
                    <button class="api-save-button" onclick="saveCloudinarySettings()">저장</button>
                </div>

                <h3>연결 상태</h3>
                <span id="cloudinaryConnectionStatus" class="status disconnected">연결 안됨</span>
                
                <div class="step-buttons">
                    <button onclick="prevStep()">이전</button>
                    <button onclick="skipStep()">건너뛰기</button>
                    <button onclick="nextStep()">다음</button>
                </div>
            </div>
        </div>
    `;

    setTimeout(loadCloudinarySettings, 0);
}




function loadPixabayStep() {
    const assistContainer = document.getElementById("content");
    assistContainer.innerHTML = `
        <div class="settings-container">
            <div class="settings-content">
                <h2>Pixabay API 등록</h2>
                <p>Pixabay API를 등록하여 고품질 이미지를 검색할 수 있습니다.</p>
                <div class="api-settings">
                    <label class="api-label">API 키:</label>
                    <input type="text" id="pixabayApiKey" class="api-input" placeholder="Pixabay API 키 입력">
                    <button class="api-save-button" onclick="savePixabaySettings()">저장</button>
                </div>

                <h3>연결 상태</h3>
                <span id="pixabayConnectionStatus" class="status disconnected">연결 안됨</span>
                
                <div class="step-buttons">
                    <button onclick="prevStep()">이전</button>
                    <button onclick="skipStep()">건너뛰기</button>
                    <button onclick="nextStep()">다음</button>
                </div>
            </div>
        </div>
    `;

    setTimeout(loadPixabaySettings, 0);
}




function loadCoupangStep() {
    const assistContainer = document.getElementById("content");
    assistContainer.innerHTML = `
        <div class="settings-container">
            <div class="settings-content">
                <h2>쿠팡 파트너스 API 등록</h2>
                <p>쿠팡 파트너스 API를 등록하여 상품 광고를 추가할 수 있습니다.</p>
                <div class="api-settings">
                    <label class="api-label">API 키:</label>
                    <input type="text" id="coupangApiKey" class="api-input" placeholder="API 키 입력">
                </div>
                <div class="api-settings">
                    <label class="api-label">시크릿 키:</label>
                    <input type="password" id="coupangApiSecret" class="api-input" placeholder="시크릿 키 입력">
                    <button class="api-save-button" onclick="saveCoupangSettings()">저장</button>
                </div>

                <h3>연결 상태</h3>
                <span id="coupangConnectionStatus" class="status disconnected">연결 안됨</span>
                
                <div class="step-buttons">
                    <button onclick="prevStep()">이전</button>
                    <button onclick="skipStep()">건너뛰기</button>
                    <button onclick="nextStep()">다음</button>
                </div>
            </div>
        </div>
    `;

    setTimeout(loadCoupangSettings, 0);
}



function loadWorkSettingsStep() {
    const assistContainer = document.getElementById("content");
    assistContainer.innerHTML = `
        <h2>작업 설정</h2>
        <p>블로그 작업에 필요한 설정을 진행하세요.</p>
        <div id="work-settings-container"></div>
        <button onclick="prevStep()">이전</button>
        <button onclick="nextStep()">다음</button>
    `;

    // 작업 설정 로드 (기존 작업 설정 로드 함수 호출)
    setTimeout(() => {
        loadRegisteredBlogs(); // 등록된 블로그 불러오기
        loadSavedPrompts(); // 저장된 프롬프트 불러오기
        loadSavedSettings(); // 저장된 설정 불러오기
    }, 0);
}


function loadFinishStep() {
    const assistContainer = document.getElementById("content");
    assistContainer.innerHTML = `
        <h2>설정 저장 및 생성</h2>
        <p>모든 설정이 완료되었습니다. 아래 버튼을 눌러 작업을 생성하세요.</p>
        <button onclick="generateContent()">작업 생성하기</button>
    `;
}


