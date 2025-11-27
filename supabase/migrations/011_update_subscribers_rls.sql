-- Admin이 모든 구독자를 조회/관리할 수 있도록 RLS 정책 수정

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can manage own subscribers" ON public.subscribers;

-- Admin은 모든 구독자 조회 가능, 일반 사용자는 본인 구독자만 조회
CREATE POLICY "Admin or own subscribers read"
    ON public.subscribers FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'seongpilryu@gmail.com'
    );

-- Admin은 모든 구독자 추가 가능, 일반 사용자는 본인 구독자만 추가
CREATE POLICY "Admin or own subscribers insert"
    ON public.subscribers FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'seongpilryu@gmail.com'
    );

-- Admin은 모든 구독자 수정 가능, 일반 사용자는 본인 구독자만 수정
CREATE POLICY "Admin or own subscribers update"
    ON public.subscribers FOR UPDATE
    USING (
        auth.uid() = user_id
        OR
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'seongpilryu@gmail.com'
    );

-- Admin은 모든 구독자 삭제 가능, 일반 사용자는 본인 구독자만 삭제
CREATE POLICY "Admin or own subscribers delete"
    ON public.subscribers FOR DELETE
    USING (
        auth.uid() = user_id
        OR
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'seongpilryu@gmail.com'
    );
