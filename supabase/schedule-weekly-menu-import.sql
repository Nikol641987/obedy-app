select cron.unschedule(jobid)
from cron.job
where jobname = 'import-4m-weekly-menu';

select cron.schedule(
    'import-4m-weekly-menu',
    '*/10 15-20 * * 0',
    $$
    select net.http_post(
        url := 'https://krzouuhouzzlvsygmalb.supabase.co/functions/v1/check-4m-menu',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', 'sb_publishable_G5IG29m-XPhRhc3eB0Dy3Q__5Vcdflw'
        ),
        body := '{"automated": true}'::jsonb
    );
    $$
);
