from typing import Dict, List, Any

CHECKLIST_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "VALIDATE": [
        {
            "task": "Define your target customer persona in detail",
            "completed": False,
            "resource_url": "https://www.hubspot.com/make-my-persona",
        },
        {
            "task": "Conduct at least 10 customer discovery interviews",
            "completed": False,
            "resource_url": "https://www.nngroup.com/articles/user-interviews/",
        },
        {
            "task": "Map out the problem-solution fit canvas",
            "completed": False,
            "resource_url": "https://www.strategyzer.com/canvas/value-proposition-canvas",
        },
        {
            "task": "Research your top 5 competitors and document differentiation",
            "completed": False,
            "resource_url": "https://www.semrush.com/blog/competitor-analysis/",
        },
        {
            "task": "Estimate total addressable market (TAM), SAM, and SOM",
            "completed": False,
            "resource_url": "https://www.investopedia.com/terms/t/total-addressable-market.asp",
        },
        {
            "task": "Build and test a landing page to gauge interest",
            "completed": False,
            "resource_url": "https://unbounce.com/landing-page-articles/what-is-a-landing-page/",
        },
        {
            "task": "Run a smoke test or pre-sell campaign to validate willingness to pay",
            "completed": False,
            "resource_url": "https://www.startupschool.org/library/smoke-tests",
        },
        {
            "task": "Document key assumptions and define success metrics",
            "completed": False,
            "resource_url": "https://leanstartup.co/resources/articles/what-is-a-minimum-viable-product/",
        },
    ],
    "BUILD": [
        {
            "task": "Define your MVP feature set (must-have only)",
            "completed": False,
            "resource_url": "https://www.agilealliance.org/glossary/mvp/",
        },
        {
            "task": "Create wireframes and user flow diagrams",
            "completed": False,
            "resource_url": "https://www.figma.com/blog/how-to-wireframe/",
        },
        {
            "task": "Set up your development environment and version control",
            "completed": False,
            "resource_url": "https://docs.github.com/en/get-started/quickstart/set-up-git",
        },
        {
            "task": "Build the core backend API and database schema",
            "completed": False,
            "resource_url": "https://fastapi.tiangolo.com/tutorial/",
        },
        {
            "task": "Implement authentication and basic security",
            "completed": False,
            "resource_url": "https://owasp.org/www-project-top-ten/",
        },
        {
            "task": "Set up CI/CD pipeline for automated testing and deployment",
            "completed": False,
            "resource_url": "https://docs.github.com/en/actions/automating-builds-and-tests",
        },
        {
            "task": "Conduct internal alpha testing and fix critical bugs",
            "completed": False,
            "resource_url": "https://www.guru99.com/alpha-testing.html",
        },
        {
            "task": "Gather beta user feedback and iterate on UX",
            "completed": False,
            "resource_url": "https://uxdesign.cc/the-complete-guide-to-beta-testing-b51e4b7b3e8f",
        },
    ],
    "LAUNCH": [
        {
            "task": "Set up analytics and monitoring (e.g. Mixpanel, Sentry)",
            "completed": False,
            "resource_url": "https://mixpanel.com/blog/product-analytics/",
        },
        {
            "task": "Prepare a launch announcement and press kit",
            "completed": False,
            "resource_url": "https://www.producthunt.com/launch",
        },
        {
            "task": "Submit to Product Hunt and relevant directories",
            "completed": False,
            "resource_url": "https://www.producthunt.com/",
        },
        {
            "task": "Set up customer support channel (e.g. Intercom, Crisp)",
            "completed": False,
            "resource_url": "https://www.intercom.com/",
        },
        {
            "task": "Define and implement your onboarding flow",
            "completed": False,
            "resource_url": "https://www.appcues.com/blog/user-onboarding-examples",
        },
        {
            "task": "Configure billing and subscription management",
            "completed": False,
            "resource_url": "https://stripe.com/docs/billing",
        },
        {
            "task": "Launch targeted marketing campaigns across key channels",
            "completed": False,
            "resource_url": "https://moz.com/beginners-guide-to-seo",
        },
        {
            "task": "Establish KPI dashboard and weekly review cadence",
            "completed": False,
            "resource_url": "https://amplitude.com/blog/product-kpis",
        },
    ],
}
