-- ============================================
-- ADD DEMO DATA FOR PRESENTATION
-- Makes dashboards look good with realistic data
-- Run AFTER you can log in
-- ============================================

-- Get your user email
DO $$
DECLARE
    demo_user_email TEXT := 'john@aiadvantagesolutions.ca';
    demo_user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO demo_user_id
    FROM auth.users
    WHERE email = demo_user_email;

    IF demo_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Please log in first.';
    END IF;

    -- Add some daily activity data (last 7 days)
    INSERT INTO "Daily_Activities" (user_email, date, dials, conversations, meetings_booked, meetings_held, deals_closed, revenue)
    VALUES
        (demo_user_email, CURRENT_DATE - 1, 25, 8, 3, 2, 1, 15000),
        (demo_user_email, CURRENT_DATE - 2, 30, 10, 4, 3, 2, 25000),
        (demo_user_email, CURRENT_DATE - 3, 20, 6, 2, 2, 0, 0),
        (demo_user_email, CURRENT_DATE - 4, 28, 9, 3, 1, 1, 12000),
        (demo_user_email, CURRENT_DATE - 5, 22, 7, 2, 2, 1, 18000),
        (demo_user_email, CURRENT_DATE - 6, 26, 8, 3, 2, 0, 0),
        (demo_user_email, CURRENT_DATE - 7, 24, 7, 2, 1, 1, 20000)
    ON CONFLICT (user_email, date) DO NOTHING;

    -- Add a sample conversation analysis
    INSERT INTO "Conversation_Analyses" (
        user_email,
        date,
        conversation_title,
        conversation_type,
        duration_minutes,
        transcript,
        overall_sandler_score,
        upfront_contract_score,
        pain_funnel_score,
        budget_discussion_score,
        decision_process_score,
        bonding_rapport_score,
        talk_listen_ratio_score,
        what_went_well,
        areas_to_improve,
        specific_recommendations,
        talk_percentage,
        question_count,
        pain_identified,
        budget_discussed,
        decision_makers_identified,
        upfront_contract_set
    ) VALUES (
        demo_user_email,
        CURRENT_DATE - 1,
        'Discovery Call - TechCorp Solutions',
        'discovery',
        35,
        'Rep: Hi Sarah, thanks for taking the time today. Before we dive in, here''s what I''d like to do - spend about 30 minutes understanding your current sales process challenges, and at the end you can tell me if it makes sense to continue or not. Fair enough?

Prospect: That sounds good to me.

Rep: Great. So tell me, what prompted you to take this call today?

Prospect: Well, we''re struggling with our sales team''s consistency. Some reps are crushing it, others are really struggling.

Rep: I see. Help me understand - what does that inconsistency cost you per quarter?

Prospect: Probably around $200K in lost revenue.

Rep: That''s significant. What happens if you don''t fix this in the next 90 days?

Prospect: We''ll miss our annual target, which affects our funding round.

Rep: Got it. Walk me through your current training process...

[Full conversation continues with excellent methodology execution]',
        8.5,
        9.0,
        8.5,
        9.0,
        8.0,
        8.5,
        9.0,
        ARRAY['Set clear upfront contract', 'Excellent pain funnel questions', 'Quantified the problem with numbers', 'Good talk/listen ratio (28%)'],
        ARRAY['Could have dug deeper into personal impact on prospect', 'Decision process mapping was light'],
        ARRAY['Ask "What does that mean for you personally?" when discussing pain', 'Map out complete decision-making org chart'],
        28,
        15,
        TRUE,
        TRUE,
        TRUE,
        TRUE
    ) ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Demo data added successfully!';
    RAISE NOTICE 'Your dashboards now have realistic data for presentation';
END $$;
