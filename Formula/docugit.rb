# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_10.45.32_c2fa26"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_10.45.32_c2fa26/docugit-darwin-arm64"
      sha256 "dbbf6c4bc3155ca844847dde04fdba5c8c65f4942d053af23b13ec30d96ce383"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_10.45.32_c2fa26/docugit-darwin-amd64"
      sha256 "28a5eae1702af2ca9efa511578ae384b5c36671b27574b97f918118a3ee35d0f"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_10.45.32_c2fa26/docugit-linux-arm64"
      sha256 "7fc43a180e1690ce2b052c4676fd3362b524b0d182caa0ae23a9566a0a33a145"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_10.45.32_c2fa26/docugit-linux-amd64"
      sha256 "422f0d191b6e76af8499b15d046fafda07453de75c97af709c6d0a215364e9ac"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
