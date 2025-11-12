# Projects Guide

## What are Projects?

Projects help you organize related assets together for better management and workflow. Think of projects as containers for game content - you might have one project for your fantasy RPG, another for a sci-fi shooter, and a third for experimentation.

Each project can contain multiple assets of different types (3D models, audio, animations, etc.) and maintains its own settings and metadata.

## Creating a Project

1. Navigate to the **Projects** page from the main navigation
2. Click the **"Create New Project"** button
3. Fill in the project details:
   - **Name**: A descriptive name for your project (e.g., "Fantasy RPG Assets")
   - **Description**: Optional details about the project's purpose
   - **Settings**: Optional JSON configuration for project-specific settings
   - **Metadata**: Optional additional information
4. Click **"Create Project"** to save

Your new project will appear in the projects grid immediately.

## Managing Projects

### Viewing Projects

All your projects are displayed in a grid layout on the Projects page. Each project card shows:

- Project name and description
- Creation date
- Number of associated assets
- Quick action buttons

### Editing Projects

1. Click on a project card to open the project details
2. Click the **"Edit"** button
3. Update any fields you want to change
4. Click **"Save Changes"**

### Archiving Projects

When you complete a project or want to declutter your workspace:

1. Open the project you want to archive
2. Click the **"Archive"** button
3. The project will be moved to archived state

Archived projects:

- Don't appear in your main projects list by default
- Can still be accessed via the "Show Archived" filter
- Maintain all their assets and settings
- Can be restored at any time

### Restoring Archived Projects

1. Enable the **"Show Archived"** filter on the Projects page
2. Find the archived project
3. Click the **"Restore"** button
4. The project returns to your active projects list

### Deleting Projects

**Warning**: Project deletion is permanent and can only be done by administrators.

1. Open the project to delete
2. Click the **"Delete"** button (admin only)
3. Confirm the deletion in the dialog
4. All project data will be permanently removed

Note: Deleting a project does NOT delete its associated assets. Assets remain in the system but lose their project association.

## Organizing Assets

### Assigning Assets to Projects

**During Asset Creation:**
When generating new assets, you can select which project they belong to from a dropdown menu.

**After Creation:**

1. Navigate to the **Assets** page
2. Find the asset you want to assign
3. Click on the asset to open details
4. Select a project from the project dropdown
5. Save changes

### Using Project Filters

On the Assets page, you can filter assets by project:

1. Click the **"Filter by Project"** dropdown
2. Select a project to see only its assets
3. Select "All Projects" to see everything

This helps you focus on specific content sets when working.

### Viewing Project Statistics

Each project card displays:

- **Total Assets**: Count of all assets in the project
- **By Type**: Breakdown of asset types (3D models, audio, etc.)
- **Recent Activity**: Last time assets were added or modified

## Best Practices

### Project Organization

**Create Separate Projects for Each Game or World**

- Keep different games isolated to avoid confusion
- Makes it easier to export or share specific game content
- Helps track progress per-game

**Use Descriptive Names**

- Bad: "Project 1", "Test", "Stuff"
- Good: "Medieval RPG - Characters", "Sci-Fi Weapons Pack", "Environmental Props"

**Add Detailed Descriptions**
Include information like:

- Game genre and style
- Art direction notes
- Target platform
- Technical requirements

**Archive Completed Projects**

- Keeps your active workspace clean
- Maintains historical record
- Can be restored if needed

**Regular Cleanup**

- Review projects monthly
- Archive unused projects
- Delete test projects (admin)
- Reorganize assets as needed

### Workflow Tips

**Start Each Game with a New Project**
Create the project first, then generate all assets with it selected.

**Use Consistent Naming Conventions**
If you have multiple related projects:

- "RPG - Characters"
- "RPG - Weapons"
- "RPG - Environments"

**Track Project Progress**
Use the description field to note:

- Current phase (pre-production, production, polishing)
- Completion percentage
- Next steps

**Leverage Project Settings**
Store project-specific configuration in the settings field:

```json
{
  "targetPolyCount": 5000,
  "textureResolution": 2048,
  "artStyle": "low-poly",
  "colorPalette": ["#3498db", "#e74c3c", "#2ecc71"]
}
```

## Common Questions

**Q: Can I move assets between projects?**
A: Yes, edit the asset and change its project assignment.

**Q: Can assets belong to multiple projects?**
A: Currently, assets can only belong to one project at a time.

**Q: What happens to assets when I archive a project?**
A: Assets remain accessible and unchanged. Only the project itself is archived.

**Q: Can I rename a project?**
A: Yes, use the Edit function to change any project details.

**Q: How do I share a project with team members?**
A: Currently, projects are user-specific. Team collaboration features are planned for future releases.

**Q: Is there a limit to the number of projects?**
A: No hard limit, but we recommend archiving completed projects to keep your workspace manageable.

## Next Steps

- Learn about [Asset Management](/dev-book/user-guide/assets.md)
- Configure your [World Settings](/dev-book/user-guide/world-configuration-advanced.md)
- Explore [Content Generation](/dev-book/user-guide/generation.md)
