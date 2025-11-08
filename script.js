// --- 인트로 스토리텔링 데이터 ---
const dialogues = [
    "사랑하는 나의 아이들아, 드디어 이 할망이 만든 섬에 발을 디뎠구나. 나는 설문대, 이 땅의 모든 산과 오름, 그리고 숨 쉬는 너희의 어머니이니라.",
    "나의 창조의 흔적은 돌이 되었고, 백록담의 물이 되었으며, 너희가 딛고 선 역사 속에 스며들어 있단다. 이제 너희가 이 섬의 역사를 나의 눈으로 보며, 그 지혜를 깨우칠 차례이다.",
    "이 할망이 보낸 첫 번째 '창조의 씨앗'을 가지고, 설문대여성문화센터로 향해라. 너희의 탐험은 그곳의 돌에서부터 시작될지니."
];
let dialogueIndex = 0;
const dialogueBox = document.getElementById('halmang-dialogue');
const skipButton = document.getElementById('skip-button');
const introScreen = document.getElementById('intro-screen');
const mainContentWrapper = document.getElementById('main-content-wrapper');


/**
 * 다음 대사를 표시하거나 메인 화면으로 전환합니다.
 */
function nextDialogue() {
    if (dialogueIndex < dialogues.length) {
        dialogueBox.textContent = dialogues[dialogueIndex];
        dialogueIndex++;
    } else {
        // 모든 대사 완료 후 메인 화면으로 전환
        introScreen.style.display = 'none';
        mainContentWrapper.style.display = 'block';
        updateMissionStatus(); // 미션 상태 업데이트 시작
    }
    
    // 마지막 대사일 때 버튼 텍스트 변경
    if (dialogueIndex === dialogues.length) {
        skipButton.textContent = "탐험 시작하기";
    } else {
         skipButton.textContent = "다음 (SKIP)";
    }
}

// --- 미션 데이터 정의 및 상태 관리 ---
const shadows = [
    // 실제 이미지를 사용하려면 'https://placehold.co/...' 대신 'images/파일명.png'와 같은 경로를 입력하세요.
    { 
        id: 'shadow-1', 
        collected: false, 
        name: '창조의 씨앗', 
        image: 'https://placehold.co/150x150/1a5c88/ffffff?text=창조' 
    }, 
    { 
        id: 'shadow-2', 
        collected: false, 
        name: '소망의 씨앗', 
        image: 'https://placehold.co/150x150/cc3333/ffffff?text=소망' 
    },  
    { 
        id: 'shadow-3', 
        collected: false, 
        name: '평화의 씨앗', 
        image: 'https://placehold.co/150x150/333333/ffffff?text=평화' 
    }   
];

const missionDetails = {
    'shadow-1': {
        location: '설문대여성문화센터 (OT/편지 수신)',
        mission_text: "할망의 편지를 받는 순간을 셀카로 남겨, 너희 가족이 여정을 시작함을 알려라!",
    },
    'shadow-2': {
        location: '돌문화공원',
        mission_text: "가장 소중한 소원을 빌며 쌓은 '소원의 돌담' 앞에서 가족 사진을 찍어라!",
    },
    'shadow-3': {
        location: '4.3 평화공원',
        mission_text: "평화의 바람개비가 돌아가는 곳에서, 조용히 평화를 다짐하는 가족의 모습을 담아라!",
    }
};

// 최종 아티팩트 이미지 경로
const ARTIFACT_IMAGE_URL = 'https://placehold.co/300x200/28a745/ffffff?text=바우처+교환권'; // <-- 이 부분을 수정하세요.

let currentMissionId = null;
let currentStream = null; 

// DOM 요소 참조
const artifactDisplay = document.getElementById('artifact-display');
const viewArExhibitionButton = document.getElementById('view-ar-exhibition');
const modal = document.getElementById('mission-modal');
const finalArtifactImage = document.getElementById('final-artifact-image');
const artifactMessage = document.getElementById('artifact-message');

const shadowImageStep1 = document.getElementById('step1-shadow-image');
const overlayShadowImage = document.getElementById('overlay-shadow-image'); 

const missionStep1 = document.getElementById('mission-step-1');
const missionStep2 = document.getElementById('mission-step-2');
const cameraFeed = document.getElementById('camera-feed');
const photoCanvas = document.getElementById('photo-canvas');
const captureButton = document.getElementById('capture-button');
const submitButton = document.getElementById('complete-collection-button'); // 버튼 ID
const retakeButton = document.getElementById('retake-button');
const photoFeedback = document.getElementById('photo-feedback');


/**
 * 카메라 스트림을 중지하고 리소스를 해제합니다.
 */
function stopCameraStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

/**
 * 모달을 닫고 카메라 스트림을 해제합니다.
 */
function closeModal() {
    stopCameraStream();
    modal.style.display = "none";
    currentMissionId = null;
    
    // UI 초기화 (1단계로 돌아가기)
    missionStep1.style.display = 'block';
    missionStep2.style.display = 'none';
    // 오버레이 이미지 숨김
    overlayShadowImage.style.display = 'none';
}

/**
 * 미션 상태를 업데이트하고 UI에 반영합니다.
 */
function updateMissionStatus() {
    let allCollected = true;
    
    shadows.forEach(shadow => {
        const shadowElement = document.getElementById(shadow.id);
        const statusIndicator = shadowElement.querySelector('.status-indicator');

        if (shadow.collected) {
            statusIndicator.textContent = '수집 완료 ✅';
            statusIndicator.classList.remove('incomplete');
            statusIndicator.classList.add('complete');
            shadowElement.style.backgroundColor = '#d4edda';
        } else {
            statusIndicator.textContent = '미수집 ❌';
            statusIndicator.classList.remove('complete');
            statusIndicator.classList.add('incomplete');
            shadowElement.style.backgroundColor = '#eef3f7';
            allCollected = false;
        }
    });

    if (allCollected) {
        completeArtifact();
    }
}

/**
 * 미션을 시작할 다음 씨앗을 찾아 모달을 띄웁니다.
 */
function triggerNextMission() {
    const nextShadow = shadows.find(s => !s.collected);

    if (nextShadow) {
        currentMissionId = nextShadow.id;
        openLearningMode(currentMissionId); // 1단계 씨앗 수신 모드 시작
    } else {
        const currentButton = document.getElementById('trigger-next-mission');
        currentButton.textContent = '✅ 모든 씨앗 수집 완료';
        currentButton.disabled = true;
    }
}

/**
 * 1단계 씨앗 수신 모드를 시작합니다.
 */
function openLearningMode(shadowId) {
    const detail = missionDetails[shadowId];
    const shadowData = shadows.find(s => s.id === shadowId); 

    // 1단계 UI 업데이트
    document.getElementById('modal-title-1').textContent = `${shadowData.name} 수신 미션`;
    document.getElementById('modal-location-1').textContent = detail.location;
    
    // Step 1 이미지 로드
    shadowImageStep1.src = shadowData.image; 

    // Step 2 오버레이 이미지에도 미리 로드
    overlayShadowImage.src = shadowData.image;

    // 모달 표시
    modal.style.display = "block";
    missionStep1.style.display = 'block';
    missionStep2.style.display = 'none';
}

/**
 * 2단계 카메라 인증 모드를 시작하고 카메라를 켭니다.
 */
function startPhotoMission() {
    const currentDetail = missionDetails[currentMissionId];

    missionStep1.style.display = 'none';
    missionStep2.style.display = 'block';

    // 2단계 미션 텍스트 업데이트
    document.getElementById('modal-title-2').textContent = `[${shadows.find(s => s.id === currentMissionId).name}] 인증 미션`;
    document.getElementById('mission-step-2-guide').textContent = currentDetail.mission_text + ' (사진 촬영은 선택 사항입니다.)';


    // UI 초기화
    cameraFeed.style.display = 'block';
    photoCanvas.style.display = 'none';
    captureButton.style.display = 'block';
    retakeButton.style.display = 'none';
    photoFeedback.textContent = '';
    
    // 오버레이 이미지 보이기
    overlayShadowImage.style.display = 'block'; 
    
    // 카메라 스트림 요청 (전면 카메라 선호)
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
            currentStream = stream;
            cameraFeed.srcObject = stream;
        })
        .catch(err => {
            document.getElementById('modal-title-2').textContent = '카메라 접근 오류 ❌';
            photoFeedback.textContent = '카메라 접근 권한이 필요합니다. 모바일 환경에서만 지원될 수 있습니다.';
            console.error("카메라 접근 오류:", err);
            // 오류 발생 시 버튼 및 오버레이 숨기기
            captureButton.style.display = 'none';
            overlayShadowImage.style.display = 'none';
        });
}

/**
 * 카메라 피드에서 사진을 캡처합니다. (선택 사항)
 */
function capturePhoto() {
    if (!currentStream) {
        photoFeedback.textContent = '카메라 스트림이 준비되지 않았습니다.';
        return;
    }
    
    const context = photoCanvas.getContext('2d');
    const width = cameraFeed.videoWidth;
    const height = cameraFeed.videoHeight;

    if (width && height) {
        photoCanvas.width = width;
        photoCanvas.height = height;
        
        context.drawImage(cameraFeed, 0, 0, width, height);
        
        // UI 변경: 비디오/오버레이 숨기고 캔버스(캡처된 사진) 표시
        cameraFeed.style.display = 'none';
        overlayShadowImage.style.display = 'none';
        photoCanvas.style.display = 'block';
        
        // 버튼 상태 변경
        captureButton.style.display = 'none';
        retakeButton.style.display = 'block';
        
        photoFeedback.textContent = '사진 촬영 완료! 수집을 완료하려면 아래 버튼을 누르세요.';
    } else {
        photoFeedback.textContent = '비디오 스트림 로딩 중입니다. 잠시 후 다시 시도해 주세요.';
    }
}

/**
 * 사진을 다시 찍기 위해 카메라 모드로 돌아갑니다.
 */
function retakePhoto() {
    cameraFeed.style.display = 'block';
    overlayShadowImage.style.display = 'block'; 
    photoCanvas.style.display = 'none';
    captureButton.style.display = 'block';
    retakeButton.style.display = 'none';
    photoFeedback.textContent = '';
}

/**
 * 미션을 완료하고 씨앗을 수집합니다. (사진 촬영 여부와 무관)
 */
function completeSeedCollection() {
    if (!currentMissionId) return;

    photoFeedback.textContent = '✅ 씨앗 수집 성공! 할망의 뜻을 기억하세요.';
    
    // 씨앗 수집 완료 처리
    const shadowIndex = shadows.findIndex(s => s.id === currentMissionId);
    if (shadowIndex !== -1) {
        shadows[shadowIndex].collected = true;
    }
    
    // 2초 후 모달 닫고 상태 업데이트
    setTimeout(() => {
        closeModal();
        updateMissionStatus();
    }, 2000);
}


/**
 * 모든 씨앗 수집 완료 시, 최종 아티팩트를 완성하고 이미지를 표시합니다.
 */
function completeArtifact() {
    artifactMessage.style.display = 'none'; 
    
    finalArtifactImage.src = ARTIFACT_IMAGE_URL; 
    finalArtifactImage.style.display = 'block';

    if (!artifactDisplay.querySelector('.artifact-complete')) {
        artifactDisplay.insertAdjacentHTML('beforeend', `
            <div class="artifact-complete" style="margin-top: 15px;">
                <p>✨ **미션 완료!** 설문대할망의 모든 씨앗을 수집했습니다!</p>
                <p><strong>[시장 바우처]</strong> 교환권을 수령하고 야시장으로 향하세요!</p>
            </div>
        `);
    }

    viewArExhibitionButton.disabled = false;
    viewArExhibitionButton.textContent = '바우처 교환 안내 보기';
    viewArExhibitionButton.style.backgroundColor = '#28a745';
}

// 페이지 로드 시 초기 상태 설정
document.addEventListener('DOMContentLoaded', () => {
    // 인트로 화면의 첫 대사 시작
    nextDialogue();
    
    // 모달 외부 클릭 시 닫기
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }
    
    viewArExhibitionButton.addEventListener('click', () => {
        alert("바우처 교환처 상세 위치 및 사용 안내 페이지로 이동합니다. (구현 필요)");
    });
});