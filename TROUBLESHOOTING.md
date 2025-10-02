# 방문자 카운터 문제 해결 가이드

## 🔍 "확인 불가" 문제 원인 및 해결 방법

### 1. **GoatCounter 계정 설정 문제**

**증상**: "GoatCounter 계정을 찾을 수 없음" 메시지

**해결 방법**:
1. [GoatCounter 가입](https://www.goatcounter.com/signup)
2. 새 사이트 생성 (사이트 이름: `readmuch`)
3. 설정에서 제공되는 코드 확인
4. `config/site-config.json` 파일에서 올바른 ID로 업데이트

```json
{
  "analytics": {
    "goatcounter": {
      "id": "your-actual-id",
      "url": "https://your-actual-id.goatcounter.com"
    }
  }
}
```

### 2. **로컬 환경 CORS 문제**

**증상**: "로컬 환경에서는 확인 불가" 메시지

**해결 방법**:
- GitHub Pages에 배포 후 확인
- 로컬 서버 사용 (예: `python -m http.server 8000`)
- 브라우저에서 `http://localhost:8000` 접속

### 3. **네트워크 연결 문제**

**증상**: "시간 초과" 메시지

**해결 방법**:
- 인터넷 연결 확인
- 방화벽 설정 확인
- VPN 사용 중인 경우 해제 후 재시도

### 4. **브라우저 콘솔에서 확인**

**F12** 키를 눌러 개발자 도구 열기 → **Console** 탭에서 다음 메시지 확인:

```
✅ 정상: "Analytics initialized"
✅ 정상: "Fetching visitor count from: https://..."
✅ 정상: "Visitor count data: {total: 123}"

❌ 오류: "GoatCounter script not loaded"
❌ 오류: "HTTP error! status: 404"
❌ 오류: "Failed to fetch"
```

### 5. **수동 테스트**

브라우저 주소창에서 직접 URL 테스트:
```
https://readmuch.goatcounter.com/counter/export.json
```

**정상 응답**:
```json
{
  "total": 123,
  "count": 456
}
```

**오류 응답**:
```json
{
  "error": "Site not found"
}
```

### 6. **대체 방문자 카운터**

GoatCounter가 작동하지 않을 경우 자동으로 대체 카운터 사용:
- **countapi.xyz**: 무료, 단순한 방문자 수 카운트
- 메시지에 "(대체 카운터)" 표시됨

### 7. **새로고침 버튼**

"확인 불가" 메시지가 표시되면 **새로고침** 버튼이 나타납니다:
- 버튼 클릭으로 수동 재시도
- 네트워크 문제 해결 후 사용

### 8. **완전한 해결 방법**

1. **GoatCounter 계정 생성**
2. **올바른 설정 적용**
3. **GitHub Pages에 배포**
4. **실제 도메인에서 테스트**

### 9. **임시 해결책**

GoatCounter 설정이 완료될 때까지 방문자 카운터를 숨기려면:

```html
<!-- 방문자 카운터 섹션을 주석 처리 -->
<!--
<div style="text-align: center; margin: 2em 0; font-size: 0.9em; color: #888;">
    <span id="visitor-count">방문자 수: 로딩 중...</span>
</div>
-->
```

### 10. **디버깅 정보**

문제가 지속되면 다음 정보를 확인하세요:
- 브라우저 콘솔 오류 메시지
- 네트워크 탭의 API 호출 상태
- GoatCounter 대시보드의 사이트 설정
- `config/site-config.json` 파일의 설정값

---

**💡 팁**: 대부분의 경우 GoatCounter 계정 설정이 올바르지 않거나 로컬 환경에서 테스트하는 것이 원인입니다.
