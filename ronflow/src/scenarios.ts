import { SimulatedScenario } from "./types";

export const SIMULATED_SCENARIOS: SimulatedScenario[] = [
  {
    id: "workday-hr",
    name: "Workday HR Portal Office",
    portalName: "Workday WorkSpace - Corporate HR",
    startUrl: "https://workday.company.internal/dashboard",
    states: {
      dashboard_timeoff: {
        pageTitle: "Workday Dashboard",
        url: "https://workday.company.internal/dashboard",
        layoutType: "dashboard",
        headline: "Welcome back, Operator",
        subtext: "Corporate directory and system quick links",
        fields: [
          {
            id: "btn-timeoff",
            type: "quick_action",
            label: "Time Off Quick Action",
            text: "Time Off Balance & Request Page",
            ariaLabel: "Access time off request options",
            placeholder: "",
            x: 42,
            y: 35,
            w: 180,
            h: 90,
            nextState: "tracker_request"
          },
          {
            id: "btn-profile",
            type: "quick_action",
            label: "My Profile Details",
            text: "Personal Info Profile settings Manager",
            ariaLabel: "Access personal profile metadata",
            placeholder: "",
            x: 18,
            y: 35,
            w: 180,
            h: 90,
            nextState: "dashboard_timeoff" // neutral
          },
          {
            id: "btn-pay",
            type: "quick_action",
            label: "Global Payslip",
            text: "Payroll & Payslips Dashboard Logs",
            ariaLabel: "Access payroll document details",
            placeholder: "",
            x: 66,
            y: 35,
            w: 180,
            h: 90,
            nextState: "dashboard_timeoff"
          }
        ]
      },
      tracker_request: {
        pageTitle: "Time Off Balance Tracker",
        url: "https://workday.company.internal/timeoff/tracker",
        layoutType: "sidebar_panel",
        headline: "Time Off requests and balances overview",
        subtext: "Current Vacation Bucket: 22.5 available days",
        fields: [
          {
            id: "btn-req-off",
            type: "button",
            label: "Request Time Off",
            text: "Request Time Off",
            ariaLabel: "Request Time Off Link",
            placeholder: "",
            x: 18,
            y: 55,
            w: 160,
            h: 40,
            nextState: "newoff_calendar"
          }
        ]
      },
      newoff_calendar: {
        pageTitle: "New Leave Request Page",
        url: "https://workday.company.internal/timeoff/new",
        layoutType: "form",
        headline: "Create Leave Request Entry Form",
        subtext: "Select desired dates below and review alignment",
        fields: [
          {
            id: "input-dates",
            type: "calendar_cell",
            label: "Jan 15 - Jan 22",
            text: "Leave Dates: Jan 15 - Jan 22",
            ariaLabel: "Select leave dates range input",
            placeholder: "Select range...",
            x: 50,
            y: 48,
            w: 240,
            h: 180,
            nextState: "newoff_calendar" // stays but can fill name
          },
          {
            id: "btn-submit-leave",
            type: "button",
            label: "Submit Leave Form",
            text: "Submit Leave Form for Approval",
            ariaLabel: "Submit leave request form to manager",
            placeholder: "",
            x: 80,
            y: 88,
            w: 160,
            h: 40,
            nextState: "newoff_submitted"
          }
        ]
      },
      newoff_submitted: {
        pageTitle: "New Leave Request Page",
        url: "https://workday.company.internal/timeoff/new",
        layoutType: "success_alert",
        headline: "✅ Leave Request Submitted Successfully!",
        subtext: "Route ID: RQ-89240 | Workflow assigned to Line Manager for formal approval.",
        fields: []
      }
    }
  },
  {
    id: "github-repos",
    name: "GitHub Repository Administrator",
    portalName: "GitHub Enterprise Management Studio",
    startUrl: "https://github.com/dashboard",
    states: {
      github_home: {
        pageTitle: "GitHub Home",
        url: "https://github.com/dashboard",
        layoutType: "dashboard",
        headline: "Welcome to GitHub Corporate Admin Workspace",
        subtext: "Explore current developer code repositories and system news feed",
        fields: [
          {
            id: "btn-github-create",
            type: "button",
            label: "+ Create Menu",
            text: "+ New Repository",
            ariaLabel: "Create new menu options",
            placeholder: "",
            x: 88,
            y: 4,
            w: 130,
            h: 35,
            nextState: "github_new_name"
          }
        ]
      },
      github_new_name: {
        pageTitle: "Create a New Repository",
        url: "https://github.com/new",
        layoutType: "form",
        headline: "Create a new code repository container",
        subtext: "A repository contains all project files, revision histories, and branch settings.",
        fields: [
          {
            id: "input-git-name",
            type: "input",
            label: "ronflow-core-system",
            text: "Repo Repository Name: ronflow-core",
            ariaLabel: "Repository Name",
            placeholder: "repository-name",
            x: 38,
            y: 32,
            w: 220,
            h: 35,
            nextState: "github_new_private"
          }
        ]
      },
      github_new_private: {
        pageTitle: "Create a New Repository",
        url: "https://github.com/new",
        layoutType: "form",
        headline: "Set Access Privileges & Initialize",
        subtext: "Repository name: 'ronflow-core' is available! Ready for creation.",
        fields: [
          {
            id: "radio-git-private",
            type: "radio",
            label: "Private Settings",
            text: "Private (Restricted to authorized organization teams)",
            ariaLabel: "Make this repository private",
            placeholder: "",
            x: 18,
            y: 55,
            w: 420,
            h: 30,
            nextState: "github_new_private" // stays but can create
          },
          {
            id: "btn-git-submit",
            type: "button",
            label: "Create repository",
            text: "Create Repository Button",
            ariaLabel: "Create repository container configuration",
            placeholder: "",
            x: 42,
            y: 82,
            w: 200,
            h: 40,
            nextState: "github_created"
          }
        ]
      },
      github_created: {
        pageTitle: "Repository Core Setup",
        url: "https://github.com/ronflow-org/ronflow-core",
        layoutType: "success_alert",
        headline: "🎉 Repository 'ronflow-core' Setup Completed!",
        subtext: "Private URL: git@github.com:ronflow-org/ronflow-core.git. Ready for developer push.",
        fields: []
      }
    }
  },
  {
    id: "aws-launchpad",
    name: "AWS Launch Server Instance",
    portalName: "AWS Web Cloud Operations Terminal",
    startUrl: "https://console.aws.amazon.internal/ec2/v2",
    states: {
      aws_home: {
        pageTitle: "EC2 Service Dashboard Console",
        url: "https://console.aws.amazon.internal/ec2/v2",
        layoutType: "dashboard",
        headline: "Elastic Compute Cloud (EC2) Control Center",
        subtext: "Track micro-instances, load balancers, and running server nodes",
        fields: [
          {
            id: "btn-aws-launch",
            type: "button",
            label: "Launch Server Instance Quick",
            text: "Launch Instance (New Server)",
            ariaLabel: "Launch Virtual Machine Server",
            placeholder: "",
            x: 48,
            y: 42,
            w: 220,
            h: 45,
            nextState: "aws_choose_ami"
          }
        ]
      },
      aws_choose_ami: {
        pageTitle: "EC2 Launch Wizard Configuration",
        url: "https://console.aws.amazon.internal/ec2/v2/launch",
        layoutType: "form",
        headline: "Step 1: Choose Operating System (AMI Image)",
        subtext: "Selected server OS boot disk profile defines pricing tiering",
        fields: [
          {
            id: "btn-ami-ubuntu",
            type: "quick_action",
            label: "Select Ubuntu Linux AMI Image",
            text: "Ubuntu Server LTS (64-bit AMD architecture)",
            ariaLabel: "Choose Ubuntu Linux micro OS profile",
            placeholder: "",
            x: 35,
            y: 38,
            w: 320,
            h: 60,
            nextState: "aws_configure_security"
          },
          {
            id: "btn-ami-amazon",
            type: "quick_action",
            label: "Select Amazon OS AMI Base",
            text: "Amazon Linux 2026 Core Minimal OS image",
            ariaLabel: "Choose default Amazon base image disk",
            placeholder: "",
            x: 35,
            y: 52,
            w: 320,
            h: 60,
            nextState: "aws_configure_security"
          }
        ]
      },
      aws_configure_security: {
        pageTitle: "EC2 Launch Security Grouping",
        url: "https://console.aws.amazon.internal/ec2/v2/launch#sec",
        layoutType: "form",
        headline: "Step 2: Security Group Rules Configuration",
        subtext: "Open inbound ports for incoming target system clients",
        fields: [
          {
            id: "check-aws-http",
            type: "checkbox",
            label: "Allow HTTP traffic from internet port 80",
            text: "Allow incoming HTTP request services (Port 80/443)",
            ariaLabel: "Allow web browser networking access",
            placeholder: "",
            x: 20,
            y: 48,
            w: 380,
            h: 30,
            nextState: "aws_configure_security"
          },
          {
            id: "btn-aws-finish",
            type: "button",
            label: "Launch VM Server Instance Now",
            text: "Launch Server Instance",
            ariaLabel: "Confirm EC2 instantiation configurations",
            placeholder: "",
            x: 75,
            y: 84,
            w: 220,
            h: 40,
            nextState: "aws_launched"
          }
        ]
      },
      aws_launched: {
        pageTitle: "EC2 Instances Live Operations",
        url: "https://console.aws.amazon.internal/ec2/v2/running",
        layoutType: "success_alert",
        headline: "🔥 VM Node Launch Handshake Succeeded!",
        subtext: "ID: i-0ff9dcba190 | Public IPv4 DNS: ec2-3-88-29-10.compute.amazonaws.com | Operational",
        fields: []
      }
    }
  }
];
