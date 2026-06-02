# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_13.12.55_df1e1e"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_13.12.55_df1e1e/docugit-darwin-arm64"
      sha256 "5a769a6fbe44ab91000f705e79bbb60f5f7d0a3612dd98e35ad37bbfcc8e80bb"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_13.12.55_df1e1e/docugit-darwin-amd64"
      sha256 "364226fa7f58681eea8bcbadb99f206b1e9dc69f407007297df5956d51016811"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_13.12.55_df1e1e/docugit-linux-arm64"
      sha256 "ca75ebc903bc7673a22b2df22a958086cfd2d616b9dfddea8595860cd6fb8c43"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_13.12.55_df1e1e/docugit-linux-amd64"
      sha256 "cd8bfb5ef8e2b654e3fe53d25fddb36c64f7119ef27a81e914aa9f03ab7d40a5"
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
