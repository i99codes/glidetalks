---
title: "Troubleshooting Service Mapping in Deny-All, Permit-by-Exception Environments"
excerpt: ""
categories: ["itom"]
readTime: "3 min read"
tags: ["ServiceNow", "ServiceMapping", "Discovery", "ITOM", "Cloud"]
featured: false
---

In complex enterprise environments, building accurate **service maps** often comes with unique challenges. This is especially true when working in **deny-all, permit-by-exception network models**, where every port and protocol must be explicitly opened. Such environments enhance security, but they can also create roadblocks for discovery and service mapping.

During one recent initiative, the focus was on establishing a complete **service map for applications behind Azure Load Balancers** in Azure cloud. While the service mapping from the entry was able to identify load balancer connections, the process encountered significant challenges when attempting to extend discovery into the backend servers.

#### Challenge 1: Load Balancer Pattern Limitations

The first issue was related to **pattern behavior in top-down discovery (TDD)**. By default, connection sections in certain Azure load balancer patterns expected backend rules to follow specific naming conventions. When backend rules returned with default names instead of the expected format, the connection mapping failed.

**Resolution:** The discovery team collaborated to adjust the pattern logic, ensuring it could handle variations in backend naming conventions. This allowed expected connections from load balancer pools to be created successfully.

#### Challenge 2: Horizontal Discovery Stalls

Once load balancer connections were established, service mapping attempted to extend discovery to the backend servers. However, **horizontal discovery consistently failed** due to strict firewall rules even though the port 135 is open to discovery the windows servers

* The root cause was traced to the fact that **dynamic RPC port ranges (49152–65535)** were closed on the Windows servers.
* Without access to these ports, the discovery probes could not establish Windows Management Instrumentation (WMI) sessions, halting the process.

**Resolution:** Opening the required dynamic port ranges enabled Windows servers to be discovered.

#### Challenge 3: Incomplete TCP Connection Data

Even after successful discovery of the Windows hosts, **TCP connection data was missing**. The issue was tied to **PowerShell Remoting (PSRemoting)** access. While remoting appeared enabled, discovery accounts lacked sufficient permissions to run remote PowerShell sessions or access **administrative shares (C$, ADMIN$)**.

* Testing revealed that **ports 139 and 445** required by SMB for administrative share access were blocked at the firewall.
* Without these, discovery probes could not gather local netstat data, leaving connection mapping incomplete.

**Resolution:** Enabling firewall rules for SMB traffic on ports 139 and 445, and ensuring credentials had access to administrative shares, allowed PSRemoting tests to pass. With this in place, horizontal discovery was able to collect TCP connection data and correlate it with running processes.

***Once we completed all the changes , we were able to establish the complete map from the entry point***

#### Conclusion

This troubleshooting journey underscored the balance between **security and operability** in tightly controlled environments. While deny-all, permit-by-exception models are critical for reducing risk, they can create blind spots in automated discovery and service mapping. By aligning firewall rules, credential permissions, and discovery patterns, organizations can achieve accurate and reliable **service maps**, enabling better visibility and governance of their IT landscape.
