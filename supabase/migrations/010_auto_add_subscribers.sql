-- 신규 로그인 사용자를 자동으로 subscribers에 추가하는 트리거

-- 함수: 새 profile이 생성되면 자동으로 subscriber로 추가
CREATE OR REPLACE FUNCTION auto_add_subscriber()
RETURNS TRIGGER AS $$
BEGIN
    -- profiles 테이블에 새 사용자가 추가되면
    -- subscribers 테이블에도 자동으로 추가
    INSERT INTO public.subscribers (
        user_id,
        email,
        name,
        status,
        subscribed_at
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.full_name,
        'active',
        NEW.created_at
    )
    ON CONFLICT (user_id, email) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: profiles INSERT 시 자동 실행
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_subscriber();

-- 코멘트
COMMENT ON FUNCTION auto_add_subscriber() IS '새 사용자가 가입하면 자동으로 subscribers 테이블에 추가';
COMMENT ON TRIGGER on_profile_created ON public.profiles IS '프로필 생성 시 구독자 자동 등록';
