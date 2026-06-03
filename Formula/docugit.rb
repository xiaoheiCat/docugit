# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.03_03.09.05_210419"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.03_03.09.05_210419/docugit-darwin-arm64"
      sha256 "42813671c01ba6f5edeaa248c8846c5d198034f72e3abd2f8d12c6352838c0bf"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.03_03.09.05_210419/docugit-darwin-amd64"
      sha256 "0d61d1016263431db15c5fda0f93545fcac0cf7c3d5075905e920614614b8d12"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.03_03.09.05_210419/docugit-linux-arm64"
      sha256 "22b4b87c3762234cca34c026b078d072f415672e4a46c7c7f0835895b83718fa"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.03_03.09.05_210419/docugit-linux-amd64"
      sha256 "2fe32aaf937f6a4bab79f3f65777d7480832d31f78e2bf7dee6735a02021f742"
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
