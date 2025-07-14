import { isoGitService } from "../src/services/isogit.js";
import { logger } from "@chara-codes/logger";

async function demonstrateGitOperations() {
  const workingDir = process.cwd();

  try {
    logger.info("🚀 Git Operations Demo");
    logger.info("=".repeat(50));

    // Initialize repository
    logger.info("1. Initializing git repository...");
    const initResult = await isoGitService.initializeRepository(workingDir);
    logger.info(`   ${initResult.status}: ${initResult.message}`);
    if (initResult.gitignoreUpdated) {
      logger.info(`   ✅ Added .chara/ to .gitignore`);
    }
    if (initResult.initialCommitSha) {
      logger.info(
        `   ✅ Initial commit: ${initResult.initialCommitSha.substring(
          0,
          8
        )} (${initResult.filesCommitted} files)`
      );
    }

    // Check if repository is initialized
    logger.info("\n2. Checking repository status...");
    const isInitialized = await isoGitService.isRepositoryInitialized(
      workingDir
    );
    logger.info(`   Repository initialized: ${isInitialized}`);

    // Get current HEAD SHA (should be empty for new repo)
    logger.info("\n3. Getting current HEAD SHA...");
    const headResult = await isoGitService.getCurrentHeadSha(workingDir);
    logger.info(`   ${headResult.status}: ${headResult.message}`);
    if (headResult.sha) {
      logger.info(`   HEAD SHA: ${headResult.sha}`);
    }

    // Check for uncommitted changes
    logger.info("\n4. Checking for uncommitted changes...");
    const changesResult = await isoGitService.hasUncommittedChanges(workingDir);
    logger.info(`   ${changesResult.message}`);
    logger.info(`   Has changes: ${changesResult.hasChanges}`);
    if (changesResult.changedFiles && changesResult.changedFiles.length > 0) {
      logger.info(`   Changed files: ${changesResult.changedFiles.join(", ")}`);
    }

    // Save changes to history (first commit)
    if (changesResult.hasChanges) {
      logger.info("\n5. Saving changes to history...");
      const saveResult = await isoGitService.saveToHistory(
        workingDir,
        "Initial commit - demo"
      );
      logger.info(`   ${saveResult.status}: ${saveResult.message}`);
      if (saveResult.commitSha) {
        logger.info(`   Commit SHA: ${saveResult.commitSha}`);
        logger.info(`   Files processed: ${saveResult.filesProcessed}`);
      }
    }

    // Get the last commit
    logger.info("\n6. Getting last commit...");
    const lastCommitResult = await isoGitService.getLastCommit(workingDir);
    logger.info(`   ${lastCommitResult.status}: ${lastCommitResult.message}`);
    if (lastCommitResult.commit) {
      const commit = lastCommitResult.commit;
      logger.info(`   Commit OID: ${commit.oid}`);
      logger.info(`   Message: ${commit.commit.message}`);
      logger.info(
        `   Author: ${commit.commit.author.name} <${commit.commit.author.email}>`
      );
      logger.info(
        `   Date: ${new Date(
          commit.commit.author.timestamp * 1000
        ).toISOString()}`
      );
      logger.info(
        `   Parents: ${
          commit.commit.parent.length > 0
            ? commit.commit.parent.join(", ")
            : "none (initial commit)"
        }`
      );
    }

    // Get commit history
    logger.info("\n7. Getting commit history (last 5 commits)...");
    const historyResult = await isoGitService.getCommitHistory(workingDir, {
      depth: 5,
    });
    logger.info(`   ${historyResult.status}: ${historyResult.message}`);
    if (historyResult.commits) {
      historyResult.commits.forEach((commit, index) => {
        logger.info(
          `   [${index + 1}] ${commit.oid.substring(0, 8)} - ${
            commit.commit.message
          }`
        );
      });
    }

    // Get specific commit by OID
    if (lastCommitResult.commit) {
      logger.info("\n8. Getting specific commit by OID...");
      const specificCommitResult = await isoGitService.getCommitByOid(
        workingDir,
        lastCommitResult.commit.oid
      );
      logger.info(
        `   ${specificCommitResult.status}: ${specificCommitResult.message}`
      );
      if (specificCommitResult.commit) {
        logger.info(
          `   Retrieved commit: ${specificCommitResult.commit.oid.substring(
            0,
            8
          )}`
        );
      }
    }

    // Test getting a non-existent commit
    logger.info("\n9. Testing non-existent commit...");
    const nonExistentResult = await isoGitService.getCommitByOid(
      workingDir,
      "1234567890abcdef1234567890abcdef12345678"
    );
    logger.info(`   ${nonExistentResult.status}: ${nonExistentResult.message}`);

    // Final status check
    logger.info("\n10. Final status check...");
    const finalHeadResult = await isoGitService.getCurrentHeadSha(workingDir);
    logger.info(
      `   Current HEAD: ${finalHeadResult.sha?.substring(0, 8) || "none"}`
    );

    const finalChangesResult = await isoGitService.hasUncommittedChanges(
      workingDir
    );
    logger.info(`   Uncommitted changes: ${finalChangesResult.hasChanges}`);

    logger.info("\n✅ Git operations demo completed successfully!");
  } catch (error) {
    logger.error("❌ Demo failed:", error);
    process.exit(1);
  }
}

// Run the demo
if (import.meta.main) {
  demonstrateGitOperations();
}

export { demonstrateGitOperations };
