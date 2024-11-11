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

// Firebase 인증 상태 변경 감지 및 초기 로그인 상태 확인
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // 사용자가 로그인된 경우 헤더와 모바일 메뉴 업데이트
        await updateHeader(user.uid);
    } else {
        // 사용자가 로그인되지 않은 경우 헤더와 모바일 메뉴 초기화
        updateHeaderAfterLogout();
    }
});

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
            <a href="/profile" onclick="navigateTo(event, '/profile')">나의정보</a>
            <a href="#" onclick="logout(event)">로그아웃</a>
        `;
        mobileUserActions.innerHTML = `
            <span>${userData.nickname}</span>
            <a href="/profile" onclick="navigateTo(event, '/profile')">나의정보</a>
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
            <a href="/work" onclick="requireLogin(event, '/work')">작업</a>
            <a href="/docs" onclick="requireLogin(event, '/docs')">문서</a>
            <a href="/settings" onclick="requireLogin(event, '/settings')">설정</a>
            <a href="/guide" onclick="navigateTo(event, '/guide')">가이드</a>
            <a href="/payment" onclick="requireLogin(event, '/payment')">결제</a>
            <a href="#" id="logoutLink">로그아웃</a>
        ` : `
            <a href="/" onclick="navigateTo(event, '/')">홈</a>
            <a href="/work" onclick="requireLogin(event, '/work')">작업</a>
            <a href="/docs" onclick="requireLogin(event, '/docs')">문서</a>
            <a href="/settings" onclick="requireLogin(event, '/settings')">설정</a>
            <a href="/guide" onclick="navigateTo(event, '/guide')">가이드</a>
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
                const usernameQuery = await db.collection("users").where("username", "==", usernameInput.value).get();
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
                    username: usernameInput.value,
                    email: emailInput.value,
                    nickname: document.getElementById("nickname").value
                });

                alert("회원가입이 완료되었습니다.");
                navigateTo(event, "/login");
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

        const loginValue = loginEmailOrUsername.value;
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
    if (isLoggedIn()) {
        navigateTo(event, path);
    } else {
        navigateTo(event, "/login");
    }
}


// 라우터 함수: 설정 페이지에 처음 진입할 때만 settings.html을 불러오도록 수정
async function router(path) {
    const content = document.getElementById("content");

    // 설정 페이지가 아닌 경우 먼저 클래스 제거
    document.body.classList.remove("settings-page");

    let page = "";

    switch (path) {
        case "/work":
            page = "<h2>작업 페이지</h2><p>작업 페이지 콘텐츠</p>";
            break;
        case "/docs":
            page = "<h2>문서 페이지</h2><p>문서 페이지 콘텐츠</p>";
            break;
        case "/settings":
            // 매번 settings.html을 로드하여 초기화
            page = await fetchPage("settings.html");
            content.innerHTML = page;
            showContent("status"); // 초기 상태로 status를 표시
            initSettingsPage(); // 설정 페이지 초기화
            checkAPIConnections(); // API 연결 상태 확인
            document.body.classList.add("settings-page"); // 설정 페이지에만 클래스 추가
            return; // 추가 설정 방지
        case "/guide":
            page = "<h2>가이드 페이지</h2><p>가이드 페이지 콘텐츠</p>";
            break;
        case "/payment":
            page = "<h2>결제 페이지</h2><p>결제 페이지 콘텐츠</p>";
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
            page = "<h1>Welcome to 0Bro</h1><p>프로그램 또는 회사 소개 페이지!</p>";
    }

    // 페이지가 설정 페이지가 아닌 경우만 content 업데이트
    if (path !== "/settings") {
        content.innerHTML = page;
    }
    initHamburgerMenu(); // 각 페이지 전환 후 햄버거 메뉴 초기화
}

// load 이벤트로 초기 설정 확인 및 실행
window.addEventListener("load", () => router(window.location.pathname));

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

// 설정 페이지 초기화 함수
function initSettingsPage() {
    document.querySelectorAll(".settings-sidebar a").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const contentType = event.target.getAttribute("onclick").match(/showContent\('(\w+)'\)/)[1];
            showContent(contentType);
        });
    });
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
                    <div class="status-box" id="statusGemini">
                        <p>Gemini</p>
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
            checkAPIConnections(); // API 상태 확인 함수 호출
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
            <button onclick="showOpenAiGuidePopup()" class="api-guide-button">가이드</button>
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
                <button onclick="showGeminiGuidePopup()" class="api-guide-button">가이드</button>
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
                <button onclick="showWordpressGuidePopup()" class="wp-guide-button">가이드</button>
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

function showOpenAiGuidePopup() {
    alert("OpenAI API 발급 가이드 팝업을 표시합니다."); // 이후 팝업창으로 구현 예정
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
