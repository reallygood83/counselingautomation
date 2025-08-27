'use client'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="text-white text-center">
                <div className="text-2xl mb-1">🪞</div>
                <div className="text-xs font-bold tracking-wider">MIRA</div>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent mb-4">
              개인정보처리방침
            </h1>
            <p className="text-gray-600">MIRA - Mirroring Inner Reality and Affect</p>
          </div>

          {/* 내용 */}
          <div className="prose max-w-none text-gray-800">
            <div className="space-y-8">
              
              {/* 제1조 개인정보의 처리목적 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제1조 (개인정보의 처리목적)
                </h2>
                <p className="mb-4 text-gray-700">
                  MIRA 상담 자동화 시스템(이하 "MIRA")은 다음의 목적을 위하여 개인정보를 처리합니다.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>사회정서학습(SEL) 설문조사 시스템 제공</li>
                  <li>교사의 학생 상담 및 감정분석 지원</li>
                  <li>Google OAuth 기반 인증 서비스 제공</li>
                  <li>사용자 맞춤형 설문 생성 및 분석</li>
                  <li>시스템 운영 및 개선</li>
                </ul>
              </section>

              {/* 제2조 처리하는 개인정보 항목 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제2조 (처리하는 개인정보 항목)
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">▶ 필수항목</h3>
                    <ul className="list-disc pl-6 text-gray-700">
                      <li>Google 계정 정보 (이메일, 이름, 프로필 이미지)</li>
                      <li>Google OAuth 액세스 토큰</li>
                      <li>시스템 접속 기록</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">▶ 선택항목</h3>
                    <ul className="list-disc pl-6 text-gray-700">
                      <li>Gemini API 키 (사용자가 직접 제공하는 경우)</li>
                      <li>설문 생성 및 분석 데이터</li>
                      <li>Google Drive, Forms, Sheets 연동 데이터</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 제3조 개인정보의 처리 및 보유기간 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제3조 (개인정보의 처리 및 보유기간)
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>OAuth 토큰:</strong> 서비스 이용 중 임시 보관, 만료 시 자동 삭제</li>
                  <li><strong>Google 계정 정보:</strong> 서비스 이용 중 보관, 계정 연동 해제 시 즉시 삭제</li>
                  <li><strong>Gemini API 키:</strong> 사용자의 개인 Google Drive에 암호화 저장, 사용자가 직접 관리</li>
                  <li><strong>설문 데이터:</strong> 사용자의 개인 Google Drive에 저장, MIRA 시스템에는 저장되지 않음</li>
                </ul>
              </section>

              {/* 제4조 개인정보 보호를 위한 기술적 조치 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제4조 (개인정보 보호를 위한 기술적 조치)
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>분산형 아키텍처:</strong> 개인정보를 중앙 서버에 저장하지 않고 개별 Google 계정에만 보관</li>
                  <li><strong>암호화:</strong> 민감한 정보(API 키 등)는 Base64 암호화하여 저장</li>
                  <li><strong>최소 권한 원칙:</strong> 필요한 Google API 권한만 요청</li>
                  <li><strong>HTTPS 통신:</strong> 모든 데이터 전송 시 SSL/TLS 암호화</li>
                  <li><strong>토큰 관리:</strong> OAuth 토큰 자동 갱신 및 만료 관리</li>
                </ul>
              </section>

              {/* 제5조 개인정보의 제3자 제공 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제5조 (개인정보의 제3자 제공)
                </h2>
                <p className="text-gray-700 mb-4">
                  MIRA는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 
                  다만, 다음의 경우에는 예외로 합니다:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>사용자가 사전에 동의한 경우</li>
                  <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ul>
              </section>

              {/* 제6조 개인정보 처리의 위탁 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제6조 (개인정보 처리의 위탁)
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-700">MIRA는 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-gray-700">수탁업체</th>
                          <th className="text-left py-2 text-gray-700">위탁업무 내용</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600">
                        <tr className="border-b">
                          <td className="py-2">Google LLC</td>
                          <td className="py-2">OAuth 인증, Google Drive/Forms/Sheets API 서비스</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Vercel Inc.</td>
                          <td className="py-2">웹 호스팅 및 배포 서비스</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* 제7조 정보주체의 권리 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제7조 (정보주체의 권리·의무 및 행사방법)
                </h2>
                <p className="text-gray-700 mb-4">
                  사용자는 언제든지 다음과 같은 개인정보 보호 관련 권리를 행사할 수 있습니다:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>개인정보 처리현황 통지 요구</li>
                  <li>개인정보 처리정지 요구</li>
                  <li>개인정보 삭제요구 (Google 계정 연동 해제)</li>
                  <li>손해배상청구</li>
                </ul>
                <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-sm text-teal-800">
                    <strong>권리 행사 방법:</strong> Google 계정 설정에서 MIRA 앱 연동을 해제하거나, 
                    Google Drive에서 'MIRA 상담자동화' 폴더를 삭제하실 수 있습니다.
                  </p>
                </div>
              </section>

              {/* 제8조 개인정보 보호책임자 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제8조 (개인정보 보호책임자)
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">개인정보 보호책임자</h3>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li><strong>성명:</strong> 김문정</li>
                        <li><strong>소속:</strong> 안양 박달초등학교</li>
                        <li><strong>연락처:</strong> 문의 시 제공</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">개인정보 보호 담당부서</h3>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li><strong>부서명:</strong> MIRA 개발팀</li>
                        <li><strong>처리업무:</strong> 개인정보 보호 관련 업무</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* 제9조 권익침해 구제방법 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제9조 (권익침해 구제방법)
                </h2>
                <p className="text-gray-700 mb-4">
                  개인정보 침해로 인한 구제를 받기 위하여 개인정보보호위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 
                  분쟁해결이나 상담 등을 신청할 수 있습니다.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>▶ 개인정보보호위원회: privacy.go.kr (국번없이 182)</li>
                    <li>▶ 개인정보침해신고센터: privacy.kisa.or.kr (국번없이 182)</li>
                    <li>▶ 대검찰청: www.spo.go.kr (국번없이 1301)</li>
                    <li>▶ 경찰청: ecrm.cyber.go.kr (국번없이 182)</li>
                  </ul>
                </div>
              </section>

              {/* 제10조 고지의 의무 */}
              <section>
                <h2 className="text-xl font-semibold text-teal-700 mb-4 border-b-2 border-teal-200 pb-2">
                  제10조 (개인정보처리방침 변경)
                </h2>
                <p className="text-gray-700">
                  이 개인정보처리방침은 2025년 1월 1일부터 적용됩니다. 
                  법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 경우에는 
                  변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                </p>
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>시행일자:</strong> 2025년 1월 1일<br/>
                    <strong>최종 개정일:</strong> 2025년 1월 1일
                  </p>
                </div>
              </section>

            </div>
          </div>

          {/* 홈으로 돌아가기 버튼 */}
          <div className="text-center mt-12">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 text-white rounded-lg hover:from-teal-600 hover:via-purple-600 hover:to-pink-600 transition-colors font-medium"
            >
              이전 페이지로 돌아가기
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}