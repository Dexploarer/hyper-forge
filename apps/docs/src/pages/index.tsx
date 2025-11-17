import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs">
            Get Started →
          </Link>
          <Link
            className="button button--secondary button--lg margin-left--md"
            to="/docs/api-reference"
          >
            API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  const features = [
    {
      title: "Interactive API Testing",
      description: (
        <>
          Test API endpoints directly in your browser with our Swagger UI. No
          authentication setup required to explore the API.
        </>
      ),
    },
    {
      title: "Complete API Reference",
      description: (
        <>
          Auto-generated documentation from OpenAPI spec. Always up-to-date with
          the latest API changes.
        </>
      ),
    },
    {
      title: "Comprehensive Guides",
      description: (
        <>
          Learn how to integrate Asset-Forge into your game development workflow
          with our detailed guides and examples.
        </>
      ),
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((feature, idx) => (
            <div key={idx} className={clsx("col col--4")}>
              <div className="text--center padding-horiz--md">
                <Heading as="h3">{feature.title}</Heading>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome`}
      description="AI-Powered 3D Asset Generation Platform Documentation"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
