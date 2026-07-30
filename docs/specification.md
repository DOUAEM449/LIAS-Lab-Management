# LIAS Laboratory Management System

## Project Overview

### Project Name

Official Web Platform for LIAS Laboratory

### Faculty

Faculty of Sciences Ben M'Sik

Hassan II University of Casablanca

### Project Type

Master Data Science & Big Data

Java Enterprise Edition (JEE) Final Project

---

# Purpose

Develop the official platform of the LIAS research laboratory.

The platform must serve two purposes:

- Official public website.
- Internal management information system.

The system centralizes every scientific and administrative activity.

It stores the complete history of the laboratory.

Nothing should ever be permanently deleted.

Every important action must be traceable.

---

# Actors

## Visitor

Public access

Can consult

- Home
- Laboratory
- Teams
- Publications
- Events
- Contact

---

## Permanent Member

Has authenticated account.

Can manage own profile.

Consult laboratory information.

Participate in activities.

Upload publications.

---

## Associated Member

External collaborator.

Limited permissions.

---

## PhD Student

Can

- manage own profile
- upload publications
- consult publications

Cannot access administrative modules.

---

## Retired Member

Account frozen.

History preserved.

---

## Former Member

Account disabled.

History preserved.

---

## Team Leader

Responsible for one research team.

Can supervise members.

Manage activities.

---

## Vice Director

Supports laboratory director.

Administrative permissions.

---

## Laboratory Director

Highest functional authority.

Can

Approve memberships

Manage mandates

Validate requests

Manage reports

Supervise laboratory

---

## System Administrator

Technical administrator.

Manages

Users

Configuration

Permissions

Security

Maintenance

---

# Main Functional Modules

## Authentication

Login

Logout

Forgot Password

JWT Authentication

Role Based Access Control

Password Encryption

---

## Public Website

Home

About

History

Mission

Vision

Research Areas

Research Teams

Members

Events

Publications

Partners

Gallery

News

Contact

Google Maps

---

## Dashboard

Statistics

Charts

Calendar

Notifications

Recent Activities

Quick Actions

---

## Member Management

Create

Update

Delete

Archive

Profile

Photo

Biography

Research Interests

Affiliation

Status

History

Search

Pagination

Filtering

Sorting

---

## Governance

Director

Vice Director

Team Leaders

Mandates

Role History

Responsibilities

Permissions

---

## Membership Requests

Application Form

Upload CV

Motivation Letter

Approval Workflow

Rejection Workflow

Automatic Account Creation

Notifications

---

## Scientific Events

Conference

Workshop

Seminar

Editions

Participants

Organizers

Calendar

Timeline

Archive

---

## Publications

CRUD

Authors

Teams

Year

DOI

Keywords

Abstract

Upload PDF

Search

---

## Document Management

Upload

Download

Preview

Categories

Tags

Version History

Permissions

Search

---

## Internal Communication

Discussions

Research Teams

Messages

Notifications

---

## Equipment Management

Inventory

Arrivals

Distribution

History

Requests

Validation

---

## Partnerships

Partners

Collaborations

Agreements

Activities

Documents

---

## Meeting Minutes

Meetings

Agenda

Minutes

Attachments

Archive

---

## Notifications

Real Notification Center

Membership

Documents

Events

Publications

System

---

## Calendar

Scientific Events

Meetings

Deadlines

---

## Annual Reports

Automatic generation.

Statistics.

Export PDF.

---

## Global Search

Members

Documents

Events

Publications

Equipment

---

# Functional Rules

Every modification must be historized.

No member loses historical information.

Status and Role are different concepts.

A member can change role.

A member can leave and return.

All affiliations must be preserved.

All mandates must be historized.

Every important action must be traceable.

---

# Non Functional Requirements

Responsive Design

Professional UI

Dark Mode

Accessibility

Performance

Security

Scalability

Maintainability

Reusable Components

REST API

Clean Architecture

SOLID Principles

Clean Code

Enterprise Level Quality

---

# Recommended Technologies

## Backend

Java 21

Spring Boot

Spring Security

Spring Data JPA

Hibernate

MySQL

Maven

REST API

JWT

Bean Validation

Swagger

Lombok

---

## Frontend

React

TypeScript

Vite

TailwindCSS

Shadcn UI

React Router

Axios

Recharts

Framer Motion

---

# Database Requirements

Normalized relational database.

Primary Keys

Foreign Keys

Indexes

Constraints

OneToOne

OneToMany

ManyToMany

History Tables

Audit Tables

---

# Final Goal

The final application must be a production-ready enterprise platform.

Every page must be connected to the backend.

Every backend endpoint must use the database.

No mockups.

No fake data.

No placeholder pages.

All CRUD operations must be fully functional.

The final result should look like the official website and management platform of a university research laboratory.