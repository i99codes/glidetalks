---
title: Automating Solaris Zone Relationships in ServiceNow CMDB
excerpt: ServiceNow Discovery creates Solaris server and Zone CIs but does not
  link them together automatically. This article walks through how to build a
  post sensor script that establishes the "Virtualized by::Virtualizes"
  relationship between cmdb_ci_solaris_server and cmdb_ci_solaris_instance,
  giving the Solaris team full topology visibility in the CMDB.
categories:
  - itom
readTime: 5 min read
tags:
  - discovery, Patterns
featured: false
---
## Background

Oracle Solaris has long been the platform of choice for organisations running mission-critical workloads on SPARC hardware. At the heart of its virtualisation model are **Zones**, lightweight isolated execution environments that run on top of a Solaris host, each appearing as its own independent server to the applications inside it.

In a well-maintained CMDB, the relationship between a Solaris server and its Zones is just as important as the CIs themselves. It is what allows teams to understand topology, trace dependencies, and assess the impact of changes or incidents on their Solaris estate. Without it, the CMDB holds the individual pieces but cannot connect them into a meaningful picture.

ServiceNow Discovery does a reasonable job of identifying Solaris infrastructure. It creates both the `cmdb_ci_solaris_server` and `cmdb_ci_solaris_instance` records when it runs against a Solaris host. However, it stops short of linking them together. The two CIs land in the CMDB as separate, unrelated records with no "Virtualized by::Virtualizes" relationship between them.

For Linux and Windows environments, ServiceNow handles this automatically through a post sensor script that fires after the Identification and Reconciliation Engine (IRE) processes the discovery payload. Solaris simply never had an equivalent. This article walks through how to build one.

## Why We Cannot Use `object_id`

The Linux/Windows script joins the server to its VM instance via `object_id`. For Solaris, this field is empty on both CIs. The correct join key is the `name` field. Both the Solaris server and its Zone share the same hostname value, making it the reliable link between the two records.

## The Solution

A post sensor script modelled directly on the Linux/Windows equivalent runs after the IRE has processed the discovery payload. It finds the `cmdb_ci_solaris_server` in the payload, matches it to a `cmdb_ci_solaris_instance` by `name`, and creates the relationship in `cmdb_rel_ci` if one does not already exist.

The only behavioural difference from the Linux/Windows version is the Zone state check. Instead of filtering on `state = terminated`, we filter on `state = off`, which is the powered-down state value used by Solaris Zones in this environment.

## Differences from the Linux/Windows Version

## Before Deploying

Verify the relationship type sys_id exists in your instance:

If the returned sys_id differs from `d93304fb0a0a0b78006081a72ef08444`, update the script before attaching it to the Solaris discovery pattern.




















Linux / Windows
Solaris




Server CI class
`cmdb_ci_linux_server` / `cmdb_ci_win_server`
`cmdb_ci_solaris_server`


Instance CI class
`cmdb_ci_vm_instance`
`cmdb_ci_solaris_instance`


Join key
`object_id`
`name`


Skip state
`terminated`
`off`


Relationship type
Virtualized by::Virtualizes
Virtualized by::Virtualizes
